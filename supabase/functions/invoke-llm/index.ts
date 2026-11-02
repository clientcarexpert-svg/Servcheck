import { createClient } from 'npm:@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const ALLOWED_MODELS = ['claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-haiku-4-5-20251001', 'claude-sonnet-4-6'];
const DEFAULT_MODEL = 'claude-haiku-5-5';
const SEARCH_MODEL = 'claude-sonnet-5-5';
const MAX_PROMPT_CHARS = 40000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 4;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PII_RULE =
  'Never output personal names, email addresses, phone numbers, street addresses or vehicle registration plates. ' +
  'Workshop or business names are allowed.';

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

// deno-lint-ignore no-explicit-any
function allText(result: any): string {
  return (result.content ?? [])
    .filter((c: { type: string }) => c.type === 'text')
    .map((c: { text: string }) => c.text)
    .join('\n');
}

function parseJson(text: string) {
  const s = text.indexOf('{');
  const e = text.lastIndexOf('}');
  if (s < 0 || e < s) throw new Error('model did not return JSON');
  return JSON.parse(text.slice(s, e + 1));
}

function toBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

const IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
};

// Download the user's own uploaded files and turn them into Claude content blocks.
// deno-lint-ignore no-explicit-any
async function fileBlocks(admin: any, userId: string, paths: unknown[]) {
  // deno-lint-ignore no-explicit-any
  const blocks: any[] = [];
  for (const p of paths.slice(0, MAX_FILES)) {
    const path = String(p ?? '');
    if (!path.startsWith(`${userId}/`) || path.includes('..')) throw new Error('forbidden file');
    const { data: blob, error } = await admin.storage.from('uploads').download(path);
    if (error || !blob) throw new Error('could not read file');
    if (blob.size > MAX_FILE_BYTES) throw new Error('file too large');
    const ext = path.toLowerCase().split('.').pop() ?? '';
    const b64 = toBase64(new Uint8Array(await blob.arrayBuffer()));
    if (ext === 'pdf') {
      blocks.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } });
    } else {
      const mt = IMAGE_TYPES[ext] ?? (Object.values(IMAGE_TYPES).includes(blob.type) ? blob.type : 'image/jpeg');
      blocks.push({ type: 'image', source: { type: 'base64', media_type: mt, data: b64 } });
    }
  }
  return blocks;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'unauthenticated' }),
      { status: 401, headers: cors });
  }

  const { mode, prompt, response_json_schema, json_schema, storage_path, storage_paths, model, add_context_from_internet } =
    await req.json();

  try {
    if (mode === 'extract') {
      if (typeof storage_path !== 'string' || !storage_path.startsWith(`${user.id}/`)) {
        return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: cors });
      }
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
      const { data: blob, error } = await admin.storage.from('uploads').download(storage_path);
      if (error) throw error;

      if (blob.size > MAX_FILE_BYTES) {
        return new Response(JSON.stringify({ error: 'file too large' }), { status: 413, headers: cors });
      }
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const b64 = toBase64(bytes);
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

    if (typeof prompt !== 'string' || prompt.length === 0 || prompt.length > MAX_PROMPT_CHARS) {
      return new Response(JSON.stringify({ error: 'invalid prompt' }), { status: 400, headers: cors });
    }

    const hasFiles = Array.isArray(storage_paths) && storage_paths.length > 0;
    // deno-lint-ignore no-explicit-any
    let userContent: any = prompt;
    if (hasFiles) {
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
      const blocks = await fileBlocks(admin, user.id, storage_paths);
      userContent = [...blocks, { type: 'text', text: prompt }];
    }

    const wantsSearch = !!add_context_from_internet && !hasFiles;
    const chosenModel = wantsSearch
      ? SEARCH_MODEL
      : hasFiles
        ? (typeof model === 'string' && ALLOWED_MODELS.includes(model) ? model : SEARCH_MODEL)
        : (typeof model === 'string' && ALLOWED_MODELS.includes(model) ? model : DEFAULT_MODEL);

    const schemaText = response_json_schema
      ? `Respond with raw JSON only matching this schema, no markdown fences, no text before or after the JSON:\n${JSON.stringify(response_json_schema)}`
      : 'You are a helpful assistant.';
    const priceRule =
      '\nIMPORTANT: Always give a real number for every price field you are asked for. Never return null or zero for prices. ' +
      'If you cannot find a live price, give your best realistic Australian market estimate in AUD from your own knowledge.';
    const needsPrices = !!response_json_schema?.properties?.price_average;

    // deno-lint-ignore no-explicit-any
    const run = async (useSearch: boolean): Promise<any> => {
      const result = await callClaude({
        model: chosenModel,
        max_tokens: 6000,
        system: schemaText + (needsPrices ? priceRule : '') +
          (hasFiles ? `\nThe attached file(s) were uploaded by the user. Only report what is actually visible. ${PII_RULE}` : '') +
          (wantsSearch && !useSearch ? '\nLive web search is unavailable, so use your own knowledge of current Australian prices.' : ''),
        messages: [{ role: 'user', content: userContent }],
        ...(useSearch ? {
          tools: [{
            type: 'web_search_20250305', name: 'web_search', max_uses: 5,
            user_location: { type: 'approximate', country: 'AU' },
          }],
        } : {}),
      });
      const text = allText(result);
      if (!response_json_schema) return text;
      const parsed = parseJson(text);
      return hasFiles ? scrubPII(parsed) : parsed;
    };

    const valid = (out: unknown) => {
      if (!needsPrices) return true;
      const o = out as Record<string, unknown>;
      return Number(o?.price_average) > 0 && Number(o?.price_low) > 0 && Number(o?.price_high) > 0;
    };

    let payload;
    try {
      payload = await run(wantsSearch);
      if (!valid(payload)) throw new Error('missing prices');
    } catch (e) {
      console.error('first attempt failed, retrying without search:', String(e));
      payload = await run(false);
      if (!valid(payload)) throw new Error('model returned no prices');
    }

    return new Response(JSON.stringify(payload),
      { headers: { ...cors, 'content-type': 'application/json' } });
  } catch (e) {
    console.error('invoke-llm error:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
