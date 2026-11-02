// deno-lint-ignore no-explicit-any
type Ctx = any;

const SITE = 'https://servcheck.vercel.app';
const ALLOWED_ORIGINS = [SITE, 'http://localhost:5173', 'http://localhost:3000'];

// Prices are decided here, never by the browser.
const PACKS: Record<string, { credits: number; cents: number; name: string }> = {
  starter: { credits: 10, cents: 499, name: 'ServCheck Starter - 10 credits' },
  value: { credits: 30, cents: 999, name: 'ServCheck Standard - 30 credits' },
};
const ANNUAL_CENTS = 3900;

const originOf = (req: Request) => {
  const o = req.headers.get('origin') ?? '';
  return ALLOWED_ORIGINS.includes(o) ? o : SITE;
};

async function stripe(method: 'GET' | 'POST', path: string, params?: URLSearchParams) {
  const key = Deno.env.get('STRIPE_SECRET_KEY');
  if (!key) throw new Error('STRIPE_SECRET_KEY not set');
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: params?.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`stripe: ${data?.error?.message ?? res.status}`);
  return data;
}

export const stripeHandlers: Record<string, (c: Ctx) => Promise<unknown>> = {
  async createCreditsCheckout(c) {
    const pack = PACKS[String(c.payload.pack_id)];
    if (!pack) return { error: 'Unknown credit pack.' };
    const origin = originOf(c.req);
    const p = new URLSearchParams({
      mode: 'payment',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'aud',
      'line_items[0][price_data][unit_amount]': String(pack.cents),
      'line_items[0][price_data][product_data][name]': pack.name,
      client_reference_id: c.user.id,
      'metadata[type]': 'credits',
      'metadata[user_id]': c.user.id,
      'metadata[credits]': String(pack.credits),
      'metadata[pack_id]': String(c.payload.pack_id),
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });
    if (c.profile.stripe_customer_id) p.set('customer', c.profile.stripe_customer_id);
    else p.set('customer_email', c.profile.email);
    const s = await stripe('POST', 'checkout/sessions', p);
    return { url: s.url };
  },

  async createSubscriptionCheckout(c) {
    if (c.payload.plan_id !== 'annual') return { error: 'Unknown plan.' };
    const exp = c.profile.premium_expires_at;
    if (c.profile.is_premium && (!exp || new Date(exp) > new Date())) return { error: 'You already have an active plan.' };
    const origin = originOf(c.req);
    const p = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'aud',
      'line_items[0][price_data][unit_amount]': String(ANNUAL_CENTS),
      'line_items[0][price_data][recurring][interval]': 'year',
      'line_items[0][price_data][product_data][name]': 'ServCheck Annual Plan',
      client_reference_id: c.user.id,
      'metadata[type]': 'premium',
      'metadata[user_id]': c.user.id,
      'subscription_data[metadata][user_id]': c.user.id,
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });
    if (c.profile.stripe_customer_id) p.set('customer', c.profile.stripe_customer_id);
    else p.set('customer_email', c.profile.email);
    const s = await stripe('POST', 'checkout/sessions', p);
    return { url: s.url };
  },

  async cancelPremiumSubscription(c) {
    const subId = c.profile.stripe_subscription_id;
    if (!subId) return { success: false, error: 'No active subscription found.' };
    const sub = await stripe('POST', `subscriptions/${subId}`, new URLSearchParams({ cancel_at_period_end: 'true' }));
    const end = sub.cancel_at ?? sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
    const iso = end ? new Date(Number(end) * 1000).toISOString() : null;
    await c.admin.from('profiles')
      .update({ premium_cancel_scheduled: true, ...(iso ? { premium_expires_at: iso } : {}) })
      .eq('id', c.user.id);
    return { success: true, cancel_at: iso };
  },
};
