import { base44 } from "@/api/base44Client";

const CREDITS_KEY = "servcheck_credits";
const FREE_CREDITS = 5;
export const FREE_CREDITS_DISPLAY = 5;
export const CREDITS_PER_CHECK = 5;

export const CREDIT_PACKS = [
  {
    id: "starter",
    label: "Starter",
    price: "$4.99",
    credits: 10,
    checks: 2,
    tagline: "2 checks",
    desc: "Run 2 checks — use them on a mechanic quote, a used car, or both.",
    priceId: "price_1TJ9TdKCvk7poMFQge0rg6f4",
  },
  {
    id: "value",
    label: "Standard",
    price: "$9.99",
    credits: 30,
    checks: 6,
    tagline: "6 checks",
    desc: "Great for comparing quotes from multiple mechanics or shortlisting a few used cars.",
    popular: true,
    priceId: "price_1TJ9TdKCvk7poMFQK4iXYAOJ",
  },

];

export const INVITE_BONUS = 10;
const INVITE_KEY = "servcheck_invited";

// Read credits from localStorage cache (set by syncCreditsFromDB)
export function getCredits() {
  const val = localStorage.getItem(CREDITS_KEY);
  if (val === null) return 0; // Unknown until DB sync — don't give free credits locally
  return parseInt(val, 10);
}

// Sync from DB and update local cache — call on app load
export async function syncCreditsFromDB() {
  try {
    const res = await base44.functions.invoke("getCredits", {});
    const credits = res.data?.credits ?? 0;
    localStorage.setItem(CREDITS_KEY, String(credits));
    window.dispatchEvent(new Event("credits-updated"));
    return credits;
  } catch {
    return getCredits();
  }
}

// Deduct via backend (source of truth) and update local cache
export async function deductCredit(amount = CREDITS_PER_CHECK) {
  try {
    const res = await base44.functions.invoke("deductCredits", { amount });
    if (res.data?.success) {
      localStorage.setItem(CREDITS_KEY, String(res.data.credits));
      window.dispatchEvent(new Event("credits-updated"));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Refund a failed check via backend (source of truth) and update local cache
export async function refundCredit() {
  try {
    const res = await base44.functions.invoke("refundCheckCredits", {});
    if (res.data?.success) {
      localStorage.setItem(CREDITS_KEY, String(res.data.credits));
      window.dispatchEvent(new Event("credits-updated"));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Add credits locally (used after Stripe purchase syncs from webhook)
export function addCredits(amount) {
  const current = getCredits();
  const next = current + amount;
  localStorage.setItem(CREDITS_KEY, String(next));
  return next;
}

// Invite bonus is handled server-side only via claimReferral backend function.
// This function is kept for backward compatibility but no longer adds local credits.
export function claimInviteBonus(code) {
  const claimed = localStorage.getItem(INVITE_KEY);
  if (claimed) return false;
  if (!code || code.trim().length < 3) return false;
  localStorage.setItem(INVITE_KEY, "1");
  // Credits are added server-side by claimReferral — DO NOT add locally
  return true;
}

export function getInviteCode() {
  let seed = localStorage.getItem("servcheck_invite_seed");
  if (!seed) {
    seed = Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem("servcheck_invite_seed", seed);
  }
  return "SC-" + seed;
}