import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Gift, Users, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const APP_URL = "https://servcheck.app";

export default function ReferralSection({ onCreditsUpdated }) {
  const [inviteCode, setInviteCode] = useState("");
  const [loadingCode, setLoadingCode] = useState(true);
  const [promoInput, setPromoInput] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    base44.functions.invoke("getInviteCode", {})
      .then(res => setInviteCode(res.data?.invite_code || ""))
      .catch(() => {})
      .finally(() => setLoadingCode(false));
  }, []);

  const referralLink = `${APP_URL}?ref=${inviteCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success("Code copied!");
  };

  const handleClaim = async () => {
    if (!promoInput.trim()) return;
    setClaiming(true);
    try {
      const res = await base44.functions.invoke("claimReferral", { code: promoInput.trim() });
      if (res.data?.success) {
        setClaimed(true);
        setPromoInput("");
        window.dispatchEvent(new Event("credits-updated"));
        if (onCreditsUpdated) onCreditsUpdated(res.data.credits);
        toast.success("🎉 5 free credits added to your account!");
      } else if (res.data?.error) {
        toast.error(res.data.error);
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Invalid or already used code.";
      toast.error(msg);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header info */}
      <div className="flex items-start gap-3 rounded-2xl bg-[#1a237e]/5 p-4">
        <div className="h-8 w-8 rounded-xl bg-[#1a237e] flex items-center justify-center flex-shrink-0">
          <Users className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#1a237e]">Refer a Friend — You Both Get 5 Credits</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Share your code. When a friend signs up and uses it, you each get 5 free credits. Up to 5 friends.
          </p>
        </div>
      </div>

      {/* Your referral link */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Your Referral Link</p>
        {loadingCode ? (
          <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
        ) : (
          <div className="flex gap-2">
            <div className="flex-1 h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 flex items-center overflow-hidden">
              <span className="text-xs text-slate-500 truncate font-mono">{referralLink}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="h-10 px-3.5 rounded-xl bg-[#1a237e] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#283593] transition-colors flex-shrink-0"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
          </div>
        )}
      </div>

      {/* Your code */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Your Code</p>
        {loadingCode ? (
          <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
        ) : (
          <div className="flex gap-2 items-center">
            <div className="flex-1 h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 flex items-center">
              <span className="text-sm font-bold font-mono tracking-widest text-[#1a237e]">{inviteCode}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition-colors flex-shrink-0"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100" />

      {/* Claim a code */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-emerald-600" />
          <p className="text-sm font-bold text-slate-800">Have a Friend's Code? Claim 5 Credits</p>
        </div>
        {claimed ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-emerald-800">Code claimed — 5 credits added!</p>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Enter friend's code"
              value={promoInput}
              onChange={e => setPromoInput(e.target.value.toUpperCase())}
              className="h-10 font-mono text-sm uppercase bg-slate-50"
              onKeyDown={e => e.key === "Enter" && handleClaim()}
            />
            <Button
              onClick={handleClaim}
              disabled={!promoInput.trim() || claiming}
              className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex-shrink-0 rounded-xl"
            >
              {claiming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Claim"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}