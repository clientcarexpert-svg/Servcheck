import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Lock, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { syncCreditsFromDB, getCredits, CREDITS_PER_CHECK } from "@/lib/credits";

const FEATURES = [
  "28 checks a year — quote, symptom & used car checks",
  "Car Buyer Check — valuation before you buy",
  "Equity Meter — live market value for your car",
  "Unlimited logbook, reminders & receipt uploads",
];

export default function PremiumGate({ children, user }) {
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(() => getCredits());
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isPremiumVerified, setIsPremiumVerified] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        // Check premium status server-side
        const res = await base44.functions.invoke("getPremiumStatus", {});
        if (res.data?.is_premium) {
          setIsPremiumVerified(true);
          setCheckingStatus(false);
          return;
        }
        // Also sync credits — if they have enough credits, let them through
        const synced = await syncCreditsFromDB();
        setCredits(synced);
      } catch {}
      setCheckingStatus(false);
    };
    check();
  }, []);

  const isPremium = isPremiumVerified ||
    (user?.is_premium && (!user?.premium_expires_at || new Date(user.premium_expires_at) > new Date()));

  // Let users with enough credits through — the credit deduction gate in the form handles the rest
  const hasEnoughCredits = credits >= CREDITS_PER_CHECK;

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#f97316] rounded-full animate-spin" />
      </div>
    );
  }

  if (isPremium || hasEnoughCredits) return children;

  const handleUpgrade = async () => {
    if (window.self !== window.top) {
      alert("Checkout only works from the published app. Please open the app directly.");
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("createSubscriptionCheckout", { plan_id: "annual" });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error("Could not start checkout. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200"
      >
        {/* Header */}
        <div
          className="px-6 py-8 text-center relative overflow-hidden"
          style={{ background: "#0A0F2C" }}
        >
          <div className="h-14 w-14 rounded-2xl bg-[#f97316] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-white mb-1">Premium Access</h2>
          <p className="text-slate-400 text-sm">Unlock the full ServCheck toolkit</p>

          <div className="mt-5 inline-flex items-end gap-1 bg-white/10 rounded-2xl px-6 py-3">
            <span className="font-heading font-black text-4xl text-white">$39</span>
            <span className="text-slate-300 text-sm mb-1.5">/year</span>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white px-6 py-5 space-y-3">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-[#f97316] flex-shrink-0 mt-0.5" />
              <span className="text-sm text-slate-700 font-medium">{f}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-white px-6 pb-6">
          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full h-12 bg-[#f97316] hover:bg-[#ea6c0a] text-white font-heading font-bold text-base rounded-2xl"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <><Sparkles className="h-4 w-4 mr-2" /> Get the Annual Plan</>
            )}
          </Button>
          <p className="text-center text-xs text-slate-400 mt-3">Cancel anytime · Billed yearly</p>
        </div>

        {/* Lock note */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <p className="text-xs text-slate-500">This feature requires a Premium subscription</p>
        </div>
      </motion.div>
    </div>
  );
}