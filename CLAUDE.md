# ServCheck project notes (for Claude Code)

ServCheck is an Australian app that checks mechanic quotes and finds verified workshops. The owner (Samir) does not write code. Explain things in plain English, give short do-this-do-that steps, and be blunt.

## Stack
- Frontend: React + Vite, hosted on Vercel (https://servcheck.vercel.app). Pushing to `main` on GitHub redeploys automatically.
- Backend: Supabase project "Real one" (ref mheooerbifwxajdtdrld). Postgres with row level security, Edge Functions, private storage bucket `uploads`.
- Payments: Stripe (currently test mode), done in Edge Functions.
- AI: Anthropic models, called only from the `invoke-llm` Edge Function (key stays server-side).

## How the app talks to the backend
- `src/api/base44Client.js` is a drop-in replacement for the old Base44 SDK. Entities map to snake_case plural tables (the `User` entity maps to `profiles`).
- `base44.functions.invoke(name, payload)` calls the single `api` Edge Function with `{ fn, payload }`. `invoke-llm` is its own function.
- Backend function source lives in `supabase/functions/` (the deployed copy of `api`, `stripe.ts` and `stripe-webhook` may be newer than the repo; check before overwriting).

## Rules
- Never put secrets (Stripe, Anthropic, service role keys) in code or commit them. Secrets are set directly in the Supabase dashboard.
- Credits are changed only on the server (adjust_credits and related functions), never from the browser.
- Free signup credits: only the first account per device gets them (server function `claim_signup_bonus`; app sends `device_id`).
- Mechanic distance uses our own `suburbs` table (public Australian postcode data), not Google Maps or Nominatim.
- Commit with clear messages and push to `main` when the owner asks.
