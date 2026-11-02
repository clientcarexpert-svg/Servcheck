import { createClient } from 'npm:@supabase/supabase-js@2';
import { stripeHandlers } from './stripe.ts';
import { aiHandlers } from './ai.ts';
import { HttpError } from './errors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const REFERRAL_BONUS = 5;
const REFERRER_BONUS = 5;
const HOMESCREEN_BONUS = 5;
const SIGNUP_BONUS = 5;
const MAX_DEDUCT = 50;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });

// deno-lint-ignore no-explicit-any
type Ctx = { user: any; profile: any; admin: any; payload: any; req: Request };
const MECHANIC_FIELDS = [
  'business_name', 'mechanic_type', 'abn', 'address', 'suburb', 'postcode', 'state', 'phone', 'bio',
  'specialties', 'service_radius_km', 'turnaround_preference', 'pref_job_types', 'pref_fuel_types',
  'pref_car_makes', 'pref_max_odometer', 'accepting_bookings', 'unavailable_until',
  'estimated_turnaround_days', 'available_time_slots', 'mvri_licence_number', 'mvri_licence_type',
  'utility_bill_url',
];
const pick = (src: Record<string, unknown>, keys: string[]) =>
  Object.fromEntries(keys.filter((k) => src && k in src).map((k) => [k, src[k]]));
const requireAdmin = (c: Ctx) => { if (c.profile?.role !== 'admin') throw new HttpError(403, 'admin only'); };

// ---- suburb coordinates (from the public postcode table) ----
const norm = (s: unknown) => String(s ?? '').trim().toLowerCase();
const validPostcode = (p: unknown) => /^\d{4}$/.test(String(p ?? '')) && !String(p).startsWith('1');

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = (d: number) => (d * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

// deno-lint-ignore no-explicit-any
async function loadSuburbRows(admin: any, postcodes: unknown[]) {
  const pcs = [...new Set(postcodes.map(String).filter(validPostcode))];
  if (!pcs.length) return [];
  const { data } = await admin.from('suburbs').select('postcode, locality, state, lat, lon').in('postcode', pcs);
  return data ?? [];
}

// deno-lint-ignore no-explicit-any
function coordsFor(rows: any[], postcode: unknown, suburb: unknown) {
  const inPc = rows.filter((r) => r.postcode === String(postcode));
  if (!inPc.length) return null;
  const exact = inPc.find((r) => norm(r.locality) === norm(suburb));
  if (exact) return { lat: exact.lat, lon: exact.lon };
  const lat = inPc.reduce((s, r) => s + r.lat, 0) / inPc.length;
  const lon = inPc.reduce((s, r) => s + r.lon, 0) / inPc.length;
  return { lat, lon };
}

const handlers: Record<string, (c: Ctx) => Promise<unknown>> = {
  ...stripeHandlers,
  ...aiHandlers,

  async getCredits(c) {
    // First account per device gets the signup bonus once. Later accounts on the same device get 0.
    const ip = c.req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const device = typeof c.payload.device_id === 'string' ? c.payload.device_id : null;
    const { data: claim, error } = await c.admin.rpc('claim_signup_bonus', {
      p_user: c.user.id, p_email: c.profile.email, p_device: device, p_ip: ip, p_amount: SIGNUP_BONUS,
    });
    if (error) console.error('claim_signup_bonus failed:', error.message);
    let credits = Number(c.profile.credits ?? 0);
    if (claim?.granted && !claim?.already) {
      const { data: p } = await c.admin.from('profiles').select('credits').eq('id', c.user.id).single();
      credits = Number(p?.credits ?? credits);
    }
    return { credits, signup_bonus_granted: !!(claim?.granted && !claim?.already) };
  },

  async deductCredits(c) {
    const amount = Number(c.payload.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_DEDUCT) throw new HttpError(400, 'invalid amount');
    const { data } = await c.admin.rpc('adjust_credits', {
      p_user: c.user.id, p_delta: -amount, p_action: 'deduct', p_reason: String(c.payload.reason ?? 'Check'),
    });
    if (data === null || data === undefined) {
      return { success: false, error: 'Not enough credits. Please top up to continue.', credits: Number(c.profile.credits ?? 0) };
    }
    return { success: true, credits: Number(data) };
  },

  async refundCheckCredits(c) {
    const { data } = await c.admin.rpc('refund_last_check', { p_user: c.user.id });
    if (data === null || data === undefined) return { success: false, error: 'Nothing to refund' };
    return { success: true, credits: Number(data) };
  },

  async refundUserCredits(c) {
    requireAdmin(c);
    const { user_email, credits, reason, action } = c.payload;
    const n = Number(credits);
    if (!user_email || !Number.isFinite(n) || n <= 0 || n > 10000) throw new HttpError(400, 'invalid input');
    const { data: target } = await c.admin.from('profiles').select('id').eq('email', user_email).maybeSingle();
    if (!target) throw new HttpError(404, 'user not found');
    const { data } = await c.admin.rpc('adjust_credits', {
      p_user: target.id, p_delta: action === 'deduct' ? -n : n,
      p_action: action === 'deduct' ? 'admin_deduct' : 'admin_add',
      p_reason: String(reason ?? ''), p_admin: c.profile.email,
    });
    if (data === null || data === undefined) throw new HttpError(400, 'user does not have enough credits');
    return { success: true, credits: Number(data) };
  },

  async getInviteCode(c) {
    if (c.profile.invite_code) return { invite_code: c.profile.invite_code };
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < 8; i++) {
      const code = 'SC-' + Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => alphabet[b % alphabet.length]).join('');
      const { data, error } = await c.admin.from('profiles').update({ invite_code: code })
        .eq('id', c.user.id).is('invite_code', null).select('invite_code').maybeSingle();
      if (!error && data) return { invite_code: data.invite_code };
      if (!error && !data) {
        const { data: p } = await c.admin.from('profiles').select('invite_code').eq('id', c.user.id).single();
        return { invite_code: p?.invite_code };
      }
    }
    throw new HttpError(500, 'could not create invite code');
  },

  async claimReferral(c) {
    const code = String(c.payload.code ?? '').trim();
    if (code.length < 3) return { success: false, error: 'Please enter a valid code.' };
    if (c.profile.referral_claimed) return { success: false, error: 'You have already used a code.' };
    const { data: referrer } = await c.admin.from('profiles').select('id, referral_count')
      .ilike('invite_code', code.replace(/[%_]/g, '')).maybeSingle();
    if (!referrer) return { success: false, error: 'That code is not valid.' };
    if (referrer.id === c.user.id) return { success: false, error: 'You cannot use your own code.' };
    const { data: won } = await c.admin.from('profiles').update({ referral_claimed: true })
      .eq('id', c.user.id).eq('referral_claimed', false).select('id').maybeSingle();
    if (!won) return { success: false, error: 'You have already used a code.' };
    const mine = await c.admin.rpc('adjust_credits', { p_user: c.user.id, p_delta: REFERRAL_BONUS, p_action: 'referral_bonus', p_reason: 'Referral code used' });
    await c.admin.rpc('adjust_credits', { p_user: referrer.id, p_delta: REFERRER_BONUS, p_action: 'referral_reward', p_reason: 'Friend used your code' });
    await c.admin.from('profiles').update({ referral_count: Number(referrer.referral_count ?? 0) + 1 }).eq('id', referrer.id);
    return { success: true, credits: Number(mine.data ?? 0) };
  },

  async claimHomescreenBonus(c) {
    const { count } = await c.admin.from('credit_transactions').select('id', { count: 'exact', head: true })
      .eq('user_email', c.profile.email).eq('action', 'homescreen_bonus');
    if ((count ?? 0) > 0) return { success: false, error: 'Bonus already claimed.' };
    const { data } = await c.admin.rpc('adjust_credits', { p_user: c.user.id, p_delta: HOMESCREEN_BONUS, p_action: 'homescreen_bonus', p_reason: 'Added to home screen' });
    return { success: true, credits: Number(data ?? 0) };
  },

  async recordUserAcceptances(c) {
    const p = c.payload;
    const ip = c.req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    await c.admin.from('user_acceptances').insert({
      created_by: c.profile.email, user_email: c.profile.email,
      privacy_policy_accepted: !!p.privacy_policy_accepted, terms_accepted: !!p.terms_accepted,
      privacy_policy_version: p.privacy_policy_version ?? null, terms_version: p.terms_version ?? null,
      accepted_at: new Date().toISOString(), camera_permission: p.camera_permission ?? null,
      install_source: p.install_source ?? null, ip_address: ip,
    });
    const upd: Record<string, unknown> = {};
    if (p.terms_accepted) upd.terms_accepted = true;
    if (typeof p.marketing_emails === 'boolean') upd.marketing_emails_accepted = p.marketing_emails;
    if (Object.keys(upd).length) await c.admin.from('profiles').update(upd).eq('id', c.user.id);
    return { success: true };
  },

  async getPremiumStatus(c) {
    const exp = c.profile.premium_expires_at;
    const active = !!c.profile.is_premium && (!exp || new Date(exp) > new Date());
    return { is_premium: active, premium_expires_at: exp ?? null, cancel_scheduled: !!c.profile.premium_cancel_scheduled };
  },

  async checkUsernameAvailability(c) {
    const u = String(c.payload.username ?? '').trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,24}$/.test(u)) return { available: false, message: 'Use 3-24 letters, numbers, dots or underscores.' };
    const { data } = await c.admin.from('profiles').select('id').eq('username', u).maybeSingle();
    const free = !data || data.id === c.user.id;
    return { available: free, message: free ? undefined : 'Username already taken' };
  },

  async setUserRole(c) {
    const role = c.payload.role;
    if (role !== 'mechanic' && role !== 'mobile_mechanic') throw new HttpError(403, 'role not allowed');
    if (c.profile.role === 'admin') return { success: true, role: 'admin' };
    await c.admin.from('profiles').update({ role }).eq('id', c.user.id);
    return { success: true, role };
  },

  async createMechanicProfile(c) {
    const { data: existing } = await c.admin.from('mechanic_profiles').select('*').eq('user_email', c.profile.email).maybeSingle();
    if (existing) return { profile: existing };
    const row = {
      ...pick(c.payload, MECHANIC_FIELDS),
      user_email: c.profile.email, created_by: c.profile.email,
      mechanic_id: 'MECH-' + crypto.randomUUID().slice(0, 8).toUpperCase(),
      verification_status: 'pending', subscription_tier: 'free',
    };
    const { data, error } = await c.admin.from('mechanic_profiles').insert(row).select().single();
    if (error) throw new HttpError(400, error.message);
    return { profile: data };
  },

  async updateMyMechanicProfile(c) {
    const { profile_id, updates } = c.payload;
    const { data: mine } = await c.admin.from('mechanic_profiles').select('id').eq('id', profile_id).eq('user_email', c.profile.email).maybeSingle();
    if (!mine) throw new HttpError(403, 'not your profile');
    const upd: Record<string, unknown> = pick(updates ?? {}, MECHANIC_FIELDS);
    if (updates?.verification_status === 'pending') upd.verification_status = 'pending';
    const { data, error } = await c.admin.from('mechanic_profiles').update(upd).eq('id', profile_id).select().single();
    if (error) throw new HttpError(400, error.message);
    return { profile: data };
  },

  // Admin approves or rejects a mechanic's verification.
  async approveMechanicVerification(c) {
    requireAdmin(c);
    const { profile_id, action, notes } = c.payload;
    if (action !== 'approve' && action !== 'reject') throw new HttpError(400, 'action must be approve or reject');
    const approved = action === 'approve';
    const cleanNotes = typeof notes === 'string' ? notes.slice(0, 2000) : null;
    const upd: Record<string, unknown> = {
      verification_status: approved ? 'verified' : 'rejected',
      verification_notes: cleanNotes,
    };
    if (approved) upd.is_active = true;
    const { data, error } = await c.admin.from('mechanic_profiles').update(upd).eq('id', profile_id).select('id, user_email, business_name').maybeSingle();
    if (error) throw new HttpError(400, error.message);
    if (!data) throw new HttpError(404, 'mechanic profile not found');
    // Best effort in-app notification. Never fail the approval because of this.
    const { error: nErr } = await c.admin.from('mechanic_notifications').insert({
      mechanic_profile_id: String(data.id),
      created_by: c.profile.email,
      type: approved ? 'verification_approved' : 'verification_rejected',
      title: approved ? 'You are verified' : 'Verification not approved',
      message: approved
        ? 'Your ServCheck mechanic profile is verified and now visible to customers.'
        : 'Your verification was not approved.' + (cleanNotes ? ' Reason: ' + cleanNotes : ' Please update your details and resubmit.'),
    });
    if (nErr) console.error('notification insert failed:', nErr.message);
    return { success: true, verification_status: upd.verification_status };
  },

  // Turn a postcode (and optional suburb) into coordinates, using the suburbs table. No external geocoder.
  async lookupSuburb(c) {
    const { postcode, suburb, state } = c.payload;
    if (validPostcode(postcode)) {
      const rows = await loadSuburbRows(c.admin, [postcode]);
      const hit = coordsFor(rows, postcode, suburb);
      if (hit) return { found: true, ...hit, postcode: String(postcode) };
    }
    const name = String(suburb ?? '').trim().replace(/[%_]/g, '');
    if (name.length >= 2) {
      let q = c.admin.from('suburbs').select('postcode, locality, state, lat, lon').ilike('locality', name).not('postcode', 'like', '1%');
      if (state) q = q.eq('state', String(state).toUpperCase());
      const { data } = await q.limit(1);
      if (data?.length) return { found: true, lat: data[0].lat, lon: data[0].lon, postcode: data[0].postcode };
    }
    return { found: false };
  },

  async getPublicMechanics(c) {
    let q = c.admin.from('mechanic_profiles')
      .select('id, business_name, mechanic_type, suburb, postcode, state, bio, specialties, service_radius_km, subscription_tier, accepting_bookings')
      .eq('is_active', true).eq('verification_status', 'verified');
    if (c.payload.state) q = q.eq('state', c.payload.state);
    const { data } = await q.limit(500);
    const list = data ?? [];
    const rows = await loadSuburbRows(c.admin, list.map((m: { postcode: unknown }) => m.postcode));
    const oLat = Number(c.payload.origin_lat);
    const oLon = Number(c.payload.origin_lon);
    const hasOrigin = Number.isFinite(oLat) && Number.isFinite(oLon) && c.payload.origin_lat !== null && c.payload.origin_lon !== null;
    const mechanics = list.map((m: { postcode: unknown; suburb: unknown }) => {
      const pt = coordsFor(rows, m.postcode, m.suburb);
      return {
        ...m,
        lat: pt?.lat ?? null,
        lon: pt?.lon ?? null,
        distance_km: pt && hasOrigin ? Math.round(haversineKm(oLat, oLon, pt.lat, pt.lon) * 10) / 10 : null,
      };
    });
    if (hasOrigin) {
      mechanics.sort((a: { distance_km: number | null }, b: { distance_km: number | null }) =>
        (a.distance_km ?? 1e9) - (b.distance_km ?? 1e9));
    }
    return { mechanics };
  },

  async getVerificationDocUrl(c) {
    requireAdmin(c);
    const { data: p } = await c.admin.from('mechanic_profiles').select('utility_bill_url').eq('id', c.payload.profile_id).maybeSingle();
    if (!p?.utility_bill_url) return { error: 'No document uploaded.' };
    const { data, error } = await c.admin.storage.from('uploads').createSignedUrl(p.utility_bill_url, 300);
    if (error) return { error: 'Could not open document.' };
    return { url: data.signedUrl };
  },

  async deleteUserAccount(c) {
    const email = c.profile.email;
    await c.admin.from('account_deletions').insert({
      created_by: email, user_email: email, user_full_name: c.profile.full_name ?? null,
      deletion_reason: String(c.payload.reason ?? '').slice(0, 500), deleted_at: new Date().toISOString(),
    });
    await c.admin.rpc('purge_user_data', { p_email: email });
    const { data: files } = await c.admin.storage.from('uploads').list(c.user.id, { limit: 1000 });
    if (files?.length) await c.admin.storage.from('uploads').remove(files.map((f: { name: string }) => `${c.user.id}/${f.name}`));
    await c.admin.from('profiles').delete().eq('id', c.user.id);
    const { error } = await c.admin.auth.admin.deleteUser(c.user.id);
    if (error) throw new HttpError(500, 'could not delete account');
    return { success: true };
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new HttpError(401, 'unauthenticated');

    const body = await req.json().catch(() => ({}));
    const fn = String(body.fn ?? '');
    const handler = handlers[fn];
    if (!handler) throw new HttpError(501, `function "${fn}" is not ported yet`);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single();
    if (!profile) throw new HttpError(404, 'profile not found');

    return json(await handler({ user, profile, admin, payload: body.payload ?? {}, req }));
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message, ...e.extra }, e.status);
    console.error('api error:', e);
    return json({ error: 'internal error' }, 500);
  }
});
