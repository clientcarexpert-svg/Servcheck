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

## Backend lives in Supabase, not in this folder
- Project "Real one", ref mheooerbifwxajdtdrld. The backend is Supabase Edge Functions, a Postgres database and storage. You cannot see or change it from this folder.
- Samir uses a separate Claude chat (claude.ai) that CAN edit Supabase (functions, database, secrets). That chat is where backend changes get made. This VS Code Claude edits the website code and pushes it.
- If a task needs a backend change, tell Samir plainly: "this needs a backend change, ask your claude.ai chat". Do not guess.
- Main edge function is `api` (a router: the site calls base44.functions.invoke(name, payload) and the shim in src/api/base44Client.js sends it to `api`). Other functions: invoke-llm, stripe-webhook.
- Backend source is not fully in this repo yet. The deployed copy in Supabase is the source of truth.

## What is already built on the backend
Credits (server-side only), first-account-per-device free credits, suburb distance lookup, admin verification approve/reject, Stripe credit and subscription checkout, symptom checker (diagnoseCarSymptoms), used car check (analyseUsedCar), receipt upload (processReceiptUpload), pricing cache (returns miss for now).
Not built yet: admin refunds (stripeRefund), mechanic plan checkouts, quote request and lead flow, OTP functions.

## Errors from the backend
base44Client.js puts the backend's JSON error on error.response.data (for example insufficient_credits, limit_reached, refunded). Keep that.

## How changes ship
Samir says "commit and push to main". You commit and push. Vercel rebuilds the site by itself. If git shows nothing new, the change was already pushed earlier (files may be edited by the claude.ai chat through his laptop). Say that instead of guessing who made it.

## Secrets
Never put keys in code or chat. Stripe and Anthropic keys live in Supabase Edge Function secrets.
