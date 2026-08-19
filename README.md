# ServCheck — Supabase Migration

Migrating ServCheck off Base44 to a self-hosted Supabase + React/Vite stack.

## Status

- [x] Schema generated from all 35 Base44 entities (`supabase/schema.sql`)
- [ ] Schema applied to live Supabase project
- [ ] Client shim (`src/api/base44Client.js`) rebuilt for 58 backend functions
- [ ] `invoke-llm` edge function (Anthropic) ported
- [ ] `stripe-webhook` edge function ported
- [ ] Remaining ~56 Base44 functions ported to Supabase Edge Functions
- [ ] Storage bucket (`uploads`) wired to new upload flow
- [ ] Full app tested end-to-end against new backend

## Supabase project

- URL: `https://mheooerbifwxajdtdrld.supabase.co`
- Storage bucket: `uploads` (private)

## Setup — run this once in Supabase SQL Editor

Paste the full contents of `supabase/schema.sql` into the Supabase SQL Editor
and run it. This creates all 34 tables (`profiles` + 33 entity tables), enables
Row Level Security, and sets ownership-based read/write policies matched to
whichever field each entity actually uses (`user_email` where present,
`created_by` otherwise).

**Read the NOTE block at the bottom of schema.sql before treating RLS as
final** — several tables need broader-than-owner read access for the
marketplace to work (public directory browsing, cross-user reads between a
customer and their matched mechanic). Those policy adjustments are listed
explicitly and applied in a follow-up migration file once the app is wired up
and we can test each flow.

## Edge functions — deploy via Supabase CLI (run on a machine with the CLI, e.g. your Mac)

```bash
npm install -g supabase
supabase login
supabase link --project-ref mheooerbifwxajdtdrld
supabase functions deploy invoke-llm
supabase functions deploy stripe-webhook --no-verify-jwt
```

Secrets needed (set via `supabase secrets set KEY=value`):
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Why this order

1. Schema first — nothing else works without tables + RLS in place.
2. `invoke-llm` and `stripe-webhook` next — these unblock the two things that
   actually make ServCheck a product (the AI verdict engine and payments).
3. The remaining ~56 functions get ported in priority batches after that,
   starting with auth/profile functions, then mechanic marketplace functions,
   then the long tail (admin tools, notifications, reminders).
