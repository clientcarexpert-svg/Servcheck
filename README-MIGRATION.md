# ServCheck — Supabase Migration

Migrating ServCheck off Base44 to a self-hosted Supabase + React/Vite stack.

## Status

- [x] Schema generated from all 35 Base44 entities (`supabase/schema.sql`)
- [x] Schema applied to live Supabase project
- [x] Client shim (`src/api/base44Client.js`) rebuilt for the full Base44 SDK surface
- [x] `invoke-llm` edge function (Anthropic) written
- [ ] `invoke-llm` deployed to Supabase
- [ ] `stripe-webhook` edge function ported + deployed
- [ ] Remaining ~56 Base44 functions ported to Supabase Edge Functions
- [ ] Storage bucket (`uploads`) wired to new upload flow
- [ ] Full app tested end-to-end against new backend
- [ ] Production domain pointed at the new stack (still live on Base44 until then)

## Supabase project

- URL: `https://mheooerbifwxajdtdrld.supabase.co`
- Storage bucket: `uploads` (private)

## Deploy edge functions — run from a terminal with the Supabase CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref mheooerbifwxajdtdrld
supabase functions deploy invoke-llm
supabase functions deploy stripe-webhook --no-verify-jwt
```

Secrets (set via `supabase secrets set KEY=value`):
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Why this order

1. Schema first — nothing else works without tables + RLS in place. Done.
2. `invoke-llm` and `stripe-webhook` next — these unblock the two things that
   actually make ServCheck a product (the AI verdict engine and payments).
3. The remaining ~56 functions get ported in priority batches after that.
4. Only once everything above is tested does the real domain move over.
   Base44 stays live as the production app until this is fully proven.
