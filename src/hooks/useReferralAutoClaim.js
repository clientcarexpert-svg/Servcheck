import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * Reads ?ref=CODE from the URL on mount.
 * If found and the user is logged in and hasn't already claimed, auto-claims it.
 * Clears the query param from the URL after attempting.
 */
export function useReferralAutoClaim(user) {
  useEffect(() => {
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");
    if (!refCode) return;

    // Remove ?ref= from URL immediately so it doesn't trigger again
    params.delete("ref");
    const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
    window.history.replaceState({}, "", newUrl);

    // Don't attempt if already claimed
    if (user.referral_claimed) return;

    base44.functions.invoke("claimReferral", { code: refCode.trim().toUpperCase() })
      .then(res => {
        if (res.data?.success) {
          window.dispatchEvent(new Event("credits-updated"));
          toast.success("🎉 Referral code applied — 5 free credits added!");
        } else {
          toast.error(res.data?.error || "Failed to apply referral code.");
        }
      })
      .catch(err => {
        const msg =
          err?.response?.data?.error ||
          err?.data?.error ||
          err?.message ||
          "Failed to apply referral code.";
        toast.error(msg);
      });
  }, [user?.id]);
}