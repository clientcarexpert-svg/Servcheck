// ============================================================================
// Supabase Edge Function: invoke-llm
// Replaces Base44's InvokeLLM + ExtractDataFromUploadedFile
//
// Deploy:  supabase functions deploy invoke-llm
// Secrets: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Modes:
//   mode:"llm"     -> text-only prompt to Claude. Files are NEVER forwarded.
//   mode:"extract" -> reads the uploaded file server-side from the private
//                     bucket, extracts ONLY the fields in json_schema, and
//                     scrubs PII patterns before returning. The raw file never
//                     reaches the browser-side LLM path.
// ============================================================================
import { createClient } from 'npm:@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Defence in depth: strip emails/AU phone numbers that leak into free text.
// The json_schema already limits what comes back; this catches the rest.
function scrubPII(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return obj
      .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email removed]')
      .replace(/(\+?61|0)[ -]?4\d{2}[ -]?\d{3}[ -]?\d{3}/g, '[phone removed]');
  }
  if (Array.isArray(obj)) return obj.map(scrubPII);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, scrubPII(v)]));
  }
  return obj;
}

async function callClaude(body: Record<string, unknown>) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  // Require an authenticated Supabase user
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'unauthenticated' }),
      { status: 401, headers: cors });
  }

  const { mode, prompt, response_json_schema, json_schema, storage_path, model } =
    await req.json();

  try {
    if (mode === 'extract') {
      // Read the file with the service role (private bucket) — server side only
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
      const { data: blob, error } = await admin.storage.from('uploads').download(storage_path);
      if (error) throw error;

      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const b64 = btoa(binary);
      const isPdf = storage_path.toLowerCase().endsWith('.pdf');

      const result = await callClaude({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system:
          'Extract ONLY the fields in the provided JSON schema. Do NOT include any ' +
          'personal names, email addresses, phone numbers, street addresses, or ' +
          'registration plates anywhere in your output, even inside notes fields. ' +
          'Respond with raw JSON only, no markdown fences.',
        messages: [{
          role: 'user',
          content: [
            isPdf
              ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } }
              : { type: 'image', source: { type: 'base64', media_type: blob.type || 'image/jpeg', data: b64 } },
            { type: 'text', text: `Extract per this schema:\n${JSON.stringify(json_schema)}` },
          ],
        }],
      });

      const text = result.content?.find((c: { type: string }) => c.type === 'text')?.text ?? '{}';
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      return new Response(
        JSON.stringify({ status: 'success', output: scrubPII(parsed) }),
        { headers: { ...cors, 'content-type': 'application/json' } });
    }

    // mode === "llm" — text only. Files are never accepted here.
    const result = await callClaude({
      model: typeof model === 'string' && model.startsWith('claude') ? model : 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: response_json_schema
        ? `Respond with raw JSON only matching this schema, no markdown fences:\n${JSON.stringify(response_json_schema)}`
        : 'You are a helpful assistant.',
      messages: [{ role: 'user', content: prompt }],
    });

    const text = result.content?.find((c: { type: string }) => c.type === 'text')?.text ?? '';
    const payload = response_json_schema
      ? JSON.parse(text.replace(/```json|```/g, '').trim())
      : text;

    return new Response(JSON.stringify(payload),
      { headers: { ...cors, 'content-type': 'application/json' } });
  } catch (e) {
    console.error('invoke-llm error:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
