// ============================================================================
// ServCheck — Supabase drop-in replacement for the Base44 SDK
// ============================================================================
// Keeps the exact same `base44` export and API surface the app already uses,
// so none of the ~80 files that import it need to change.
//
// Surface replicated (verified by grepping the current codebase):
//   entities:      list / filter / get / create / update / delete /
//                  bulkCreate / subscribe
//   auth:          me / updateMe / logout / redirectToLogin
//   functions:     invoke(name, payload)          (74 call sites)
//   integrations:  UploadFile / UploadPrivateFile /
//                  ExtractDataFromUploadedFile / InvokeLLM
//
// Env vars (.env, never commit):
//   VITE_SUPABASE_URL=https://mheooerbifwxajdtdrld.supabase.co
//   VITE_SUPABASE_ANON_KEY=sb_publishable_...
// Server-only secrets (Edge Function secrets, NEVER VITE_ prefixed):
//   ANTHROPIC_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export { supabase };

// ---------------------------------------------------------------------------
// Entity name -> table name (snake_case, pluralised to match schema.sql)
// ---------------------------------------------------------------------------
const toTable = (name) => {
  const s = name.replace(/(?<!^)(?=[A-Z])/g, '_').toLowerCase();
  return s.endsWith('s') ? s : s + 's';
};

// Base44 sort strings: "-created_date" / "created_date"
const applySort = (q, sort) => {
  if (!sort) return q;
  const desc = sort.startsWith('-');
  let col = desc ? sort.slice(1) : sort;
  if (col === 'created_date') col = 'created_at';
  if (col === 'updated_date') col = 'updated_at';
  return q.order(col, { ascending: !desc });
};

// Base44 exposed created_date/updated_date; map from Postgres columns
const mapRow = (row) =>
  row && { ...row, created_date: row.created_at, updated_date: row.updated_at };

const applyWhere = (q, where = {}) => {
  for (const [k, v] of Object.entries(where)) {
    const col = k === 'created_date' ? 'created_at'
              : k === 'updated_date' ? 'updated_at'
              : k;
    if (v === null) { q = q.is(col, null); continue; }
    if (v && typeof v === 'object') {
      if ('$in' in v)  { q = q.in(col, v.$in);  continue; }
      if ('$ne' in v)  { q = q.neq(col, v.$ne); continue; }
      if ('$gt' in v)  { q = q.gt(col, v.$gt);  continue; }
      if ('$gte' in v) { q = q.gte(col, v.$gte);continue; }
      if ('$lt' in v)  { q = q.lt(col, v.$lt);  continue; }
      if ('$lte' in v) { q = q.lte(col, v.$lte);continue; }
    }
    q = q.eq(col, v);
  }
  return q;
};

const entityHandler = {
  get(_, entityName) {
    const table = toTable(entityName);
    return {
      async list(sort, limit) {
        let q = supabase.from(table).select('*');
        q = applySort(q, sort);
        if (limit) q = q.limit(limit);
        const { data, error } = await q;
        if (error) throw error;
        return data.map(mapRow);
      },
      async filter(where = {}, sort, limit) {
        let q = supabase.from(table).select('*');
        q = applyWhere(q, where);
        q = applySort(q, sort);
        if (limit) q = q.limit(limit);
        const { data, error } = await q;
        if (error) throw error;
        return data.map(mapRow);
      },
      async get(id) {
        const { data, error } = await supabase
          .from(table).select('*').eq('id', id).single();
        if (error) throw error;
        return mapRow(data);
      },
      async create(payload) {
        const { data, error } = await supabase
          .from(table).insert(payload).select().single();
        if (error) throw error;
        return mapRow(data);
      },
      async bulkCreate(payloads) {
        const { data, error } = await supabase
          .from(table).insert(payloads).select();
        if (error) throw error;
        return data.map(mapRow);
      },
      async update(id, payload) {
        const { data, error } = await supabase
          .from(table)
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', id).select().single();
        if (error) throw error;
        return mapRow(data);
      },
      async delete(id) {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
        return true;
      },
      // Base44 .subscribe(cb) -> Supabase Realtime. Returns unsubscribe fn.
      // NOTE: enable Replication on these tables in the Supabase dashboard:
      //   mechanic_leads, quote_requests, diagnostic_offers, mechanic_notifications
      subscribe(callback) {
        const channel = supabase
          .channel(`rt-${table}-${Math.random().toString(36).slice(2)}`)
          .on('postgres_changes',
              { event: '*', schema: 'public', table },
              (payload) => callback({
                type: payload.eventType,
                data: mapRow(payload.new || payload.old),
              }))
          .subscribe();
        return () => supabase.removeChannel(channel);
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Auth — profiles table holds the app-level user fields
// ---------------------------------------------------------------------------
const auth = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Not authenticated');
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single();
    return { id: user.id, email: user.email, ...profile };
  },
  async updateMe(fields) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('profiles').update(fields).eq('id', user.id).select().single();
    if (error) throw error;
    return data;
  },
  async logout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  },
  redirectToLogin(fromUrl) {
    const next = encodeURIComponent(fromUrl || window.location.href);
    window.location.href = `/login?next=${next}`;
  },
  // --- New: Base44 hosted its own login/signup page externally.
  // Now that the app is self-hosted, these back the in-app /login page. ---
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName || '' } },
    });
    if (error) throw error;
    return data;
  },
  onAuthChange(callback) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
    return () => data.subscription.unsubscribe();
  },
};

// ---------------------------------------------------------------------------
// Backend functions -> Supabase Edge Functions.
// Keep the SAME function names when porting each base44/functions/* file,
// so all 74 existing call sites keep working untouched.
// ---------------------------------------------------------------------------
const functions = {
  async invoke(name, payload = {}) {
    const { data, error } = await supabase.functions.invoke(name, { body: payload });
    if (error) throw error;
    return { data };
  },
};

// ---------------------------------------------------------------------------
// Integrations
//   UploadFile / UploadPrivateFile -> Supabase Storage (private "uploads" bucket)
//   InvokeLLM / ExtractDataFromUploadedFile -> "invoke-llm" Edge Function
//     (Anthropic key stays server-side; raw files never sent from the client)
// ---------------------------------------------------------------------------
const uploadTo = async (file) => {
  const { data: { user } } = await supabase.auth.getUser();
  const safe = file.name.replace(/[^\w.\-]/g, '_');
  const path = `${user?.id || 'anon'}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from('uploads').upload(path, file);
  if (error) throw error;
  return path;
};

const Core = {
  // Public-ish upload: returns a time-limited signed URL (bucket stays private)
  async UploadFile({ file }) {
    const path = await uploadTo(file);
    const { data: signed } = await supabase.storage
      .from('uploads').createSignedUrl(path, 3600);
    return { file_url: signed?.signedUrl, file_uri: path, storage_path: path };
  },

  // Private upload: returns only the storage path, never a public URL.
  // Used for receipts, verification docs, citizenship/licence documents.
  async UploadPrivateFile({ file }) {
    const path = await uploadTo(file);
    return { file_uri: path, storage_path: path };
  },

  async InvokeLLM({ prompt, response_json_schema, add_context_from_internet, file_urls, model }) {
    // PRIVACY GUARD: never forward raw user files to the LLM from the client.
    // Use ExtractDataFromUploadedFile first, then pass only structured fields.
    if (file_urls?.length) {
      console.warn('[privacy] file_urls stripped from InvokeLLM — use ExtractDataFromUploadedFile first.');
    }
    const { data, error } = await supabase.functions.invoke('invoke-llm', {
      body: { mode: 'llm', prompt, response_json_schema, add_context_from_internet, model },
    });
    if (error) throw error;
    return data;
  },

  async ExtractDataFromUploadedFile({ file_url, file_uri, storage_path, json_schema }) {
    const path = storage_path || file_uri;
    const { data, error } = await supabase.functions.invoke('invoke-llm', {
      body: { mode: 'extract', storage_path: path, file_url, json_schema },
    });
    if (error) throw error;
    return data; // { status: 'success', output: {...} }
  },
};

export const base44 = {
  entities: new Proxy({}, entityHandler),
  auth,
  functions,
  integrations: { Core },
};
