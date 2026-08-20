import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2, ArrowRight, ShieldCheck, Lock, Receipt, Star, Zap, History, Sparkles, CheckCircle } from "lucide-react";
import { CREDIT_PACKS, CREDITS_PER_CHECK, getCredits, syncCreditsFromDB } from "@/lib/credits";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import UploadToEarnModal from "./UploadToEarnModal";
import ReferralSection from "./ReferralSection";
import { format } from "date-fns";
import { useAuth } from "@/lib/AuthContext";

const PREMIUM_FEATURES = [
  "28 checks a year — quote, symptom & used car checks",
  "Car Buyer Check & Equity Meter included",
  "Unlimited logbook, reminders & receipt uploads",
];

export default function SubscriptionModal({ onClose, onSuccess, defaultTab }) {
  const { user: authUser } = useAuth();
  const initialPremium = !!authUser?.is_premium && (!authUser?.premium_expires_at || new Date(authUser.premium_expires_at) > new Date());
  const [selected, setSelected] = useState("value");
  const [loading, setLoading] = useState(false);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [tab, setTab] = useState(defaultTab === "premium" ? "buy" : (defaultTab || "buy"));
  const [showUploadEarn, setShowUploadEarn] = useState(false);
  const [currentCredits, setCurrentCredits] = useState(getCredits());
  const [transactions, setTransactions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isPremium, setIsPremium] = useState(initialPremium);
  const [premiumExpiresAt, setPremiumExpiresAt] = useState(authUser?.premium_expires_at || null);
  const [cancelScheduled, setCancelScheduled] = useState(!!authUser?.premium_cancel_scheduled);
  const [premiumStatusLoaded, setPremiumStatusLoaded] = useState(initialPremium); // skip spinner for known-premium users
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const refreshPremiumStatus = async () => {
    try {
      const res = await base44.functions.invoke("getPremiumStatus", {});
      setIsPremium(!!res.data?.is_premium);
      setPremiumExpiresAt(res.data?.premium_expires_at || null);
      setCancelScheduled(!!res.data?.cancel_scheduled);
    } catch {}
    setPremiumStatusLoaded(true);
  };

  useEffect(() => {
    syncCreditsFromDB().then(c => setCurrentCredits(c));
    const refresh = () => setCurrentCredits(getCredits());
    window.addEventListener("credits-updated", refresh);
    refreshPremiumStatus();
    return () => window.removeEventListener("credits-updated", refresh);
  }, []);

  const handleCancelPremium = async () => {
    setCancelLoading(true);
    try {
      const res = await base44.functions.invoke("cancelPremiumSubscription", { reason: cancelReason });
      if (res.data?.success) {
        const dt = res.data.cancel_at ? format(new Date(res.data.cancel_at), "d MMM yyyy") : null;
        toast.success(dt ? `Subscription cancelled. Premium access until ${dt}.` : "Subscription cancelled.");
        setPremiumExpiresAt(res.data.cancel_at || null);
        setCancelScheduled(true);
        setShowCancelConfirm(false);
        setCancelReason("");
        // Re-fetch from backend to ensure UI matches DB
        refreshPremiumStatus();
      } else {
        toast.error(res.data?.error || "Could not cancel subscription.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not cancel subscription.");
    } finally {
      setCancelLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "history") {
      setLoadingHistory(true);
      base44.auth.me().then(user => {
        if (!user) return;
        base44.entities.CreditTransaction.filter({ user_email: user.email }, "-created_date", 20)
          .then(txns => { setTransactions(txns); setLoadingHistory(false); })
          .catch(() => setLoadingHistory(false));
      });
    }
  }, [tab]);

  const selectedPack = CREDIT_PACKS.find(p => p.id === selected);

  const handlePremiumUpgrade = async () => {
    if (window.self !== window.top) {
      alert("Checkout only works from the published app, not inside the editor preview.");
      return;
    }
    setPremiumLoading(true);
    try {
      const res = await base44.functions.invoke("createSubscriptionCheckout", { plan_id: "annual" });
      if (res.data?.url) window.location.href = res.data.url;
      else toast.error("Could not start checkout. Please try again.");
    } catch {
      toast.error("Could not start checkout. Please try again.");
    } finally {
      setPremiumLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (window.self !== window.top) {
      alert("Checkout only works from the published app, not inside the editor preview.");
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("createCreditsCheckout", { pack_id: selected });
      window.location.href = res.data.url;
    } catch (err) {
      toast.error("Could not start checkout. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-heading font-bold text-xl text-slate-900">Subscription & Credits</h2>
              <p className="text-slate-500 text-sm mt-0.5">Premium plan or top-up credits for checks.</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors ml-4 mt-0.5">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Current balance pill */}
          <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4">
            <div className="h-9 w-9 rounded-full bg-[#f97316] flex items-center justify-center flex-shrink-0">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-orange-700 font-semibold uppercase tracking-wide">Current Balance</p>
              <p className="font-heading font-bold text-2xl text-orange-600 leading-tight">{currentCredits} <span className="text-sm font-semibold text-orange-500">credits</span></p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-orange-600 font-medium">{Math.floor(currentCredits / 5)} checks left</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border border-slate-200 rounded-xl overflow-hidden">
            {[
              { id: "buy", label: "Plans & Credits" },
              { id: "earn", label: "Rewards", icon: Star },
              { id: "history", label: "History", icon: History },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[11px] font-semibold transition-all ${
                  tab === t.id
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-800 bg-white"
                }`}
              >
                {t.icon && <t.icon className="h-3 w-3" />}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence mode="wait">
          {tab === "buy" && (
            <motion.div
              key="buy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="p-5 space-y-3"
            >
              {/* Premium subscription section */}
              <div className="rounded-2xl overflow-hidden border border-slate-200">
                <div className="px-4 py-4 text-center" style={{ background: "#0A0F2C" }}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-[#f97316]" />
                    <h3 className="font-heading font-extrabold text-base text-white">Annual Plan</h3>
                    {isPremium && !cancelScheduled && (
                      <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                    )}
                    {isPremium && cancelScheduled && (
                      <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">CANCELLING</span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs mb-3">28 checks a year · Car Buyer Check · Equity Meter</p>
                  {!isPremium && (
                    <div className="inline-flex items-end gap-1 bg-white/10 rounded-xl px-4 py-2">
                      <span className="font-heading font-black text-2xl text-white">$39</span>
                      <span className="text-slate-300 text-xs mb-1">/year</span>
                    </div>
                  )}
                  {isPremium && premiumExpiresAt && (
                    <p className="text-xs text-slate-300 mt-1">
                      {cancelScheduled ? "Access until " : "Renews / ends "}{format(new Date(premiumExpiresAt), "d MMM yyyy")}
                    </p>
                  )}
                </div>
                <div className="bg-white px-4 py-3">
                  {!premiumStatusLoaded ? (
                    <div className="w-full h-10 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    </div>
                  ) : isPremium ? (
                    cancelScheduled ? (
                      <div className="w-full text-center py-2">
                        <p className="text-sm font-semibold text-slate-700">Your subscription will end on</p>
                        <p className="text-base font-bold text-slate-900 mt-0.5">
                          {premiumExpiresAt ? format(new Date(premiumExpiresAt), "d MMMM yyyy") : "end of billing period"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">You'll keep premium access until then.</p>
                      </div>
                    ) : !showCancelConfirm ? (
                      <Button
                        onClick={() => setShowCancelConfirm(true)}
                        variant="outline"
                        className="w-full h-10 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-heading font-bold rounded-xl"
                      >
                        Cancel Subscription
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-600 font-medium">Why are you cancelling? <span className="text-slate-400 font-normal">(optional)</span></p>
                        <textarea
                          value={cancelReason}
                          onChange={e => setCancelReason(e.target.value)}
                          placeholder="Tell us why (optional)..."
                          rows={2}
                          maxLength={500}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => { setShowCancelConfirm(false); setCancelReason(""); }}
                            variant="outline"
                            disabled={cancelLoading}
                            className="flex-1 h-9 text-xs"
                          >
                            Keep Subscription
                          </Button>
                          <Button
                            onClick={handleCancelPremium}
                            disabled={cancelLoading}
                            className="flex-1 h-9 text-xs bg-red-600 hover:bg-red-700 text-white font-bold gap-1"
                          >
                            {cancelLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm Cancel"}
                          </Button>
                        </div>
                      </div>
                    )
                  ) : (
                    <Button
                      onClick={handlePremiumUpgrade}
                      disabled={premiumLoading}
                      className="w-full h-10 bg-[#f97316] hover:bg-[#ea6c0a] text-white font-heading font-bold rounded-xl gap-2"
                    >
                      {premiumLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <><Sparkles className="h-4 w-4" /> Get the Annual Plan · Cancel anytime</>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-semibold">or top up credits</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {CREDIT_PACKS.map((pack) => {
                const isSelected = selected === pack.id;
                return (
                  <button
                    key={pack.id}
                    onClick={() => setSelected(pack.id)}
                    className={`w-full rounded-xl border-2 p-4 text-left transition-all relative ${
                      isSelected
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 bg-white hover:border-slate-400"
                    }`}
                  >
                    {pack.popular && (
                      <span className="absolute -top-px right-4 text-xs bg-slate-900 text-white px-3 py-0.5 rounded-b-lg font-semibold tracking-wide">
                        Most Popular
                      </span>
                    )}
                    {pack.badge && !pack.popular && (
                      <span className="absolute -top-px right-4 text-xs bg-emerald-600 text-white px-3 py-0.5 rounded-b-lg font-semibold tracking-wide">
                        {pack.badge}
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Radio */}
                        <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          isSelected ? "border-slate-900" : "border-slate-300"
                        }`}>
                          {isSelected && <div className="h-2 w-2 rounded-full bg-slate-900" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-heading font-bold text-slate-900 text-sm">{pack.label}</span>
                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              {pack.credits} credits · {pack.tagline}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{pack.desc}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="font-heading font-bold text-lg text-slate-900">{pack.price}</p>
                      </div>
                    </div>
                  </button>
                );
              })}

              <Button
                onClick={handlePurchase}
                disabled={loading}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-sm gap-2 mt-1"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting to checkout...</>
                ) : (
                  <>Continue — {selectedPack?.price} <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>

              {/* Trust bar */}
              <div className="flex items-center justify-center gap-4 pt-1">
                <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Lock className="h-3 w-3" /> Secure checkout
                </span>
                <span className="text-slate-200">|</span>
                <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <ShieldCheck className="h-3 w-3" /> Powered by Stripe
                </span>
                <span className="text-slate-200">|</span>
                <span className="text-xs text-slate-400 font-medium">Credits never expire</span>
              </div>
            </motion.div>
          )}

          {tab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="p-5"
            >
              {loadingHistory ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map(txn => {
                    const isAdd = txn.action === "add" || txn.action === "purchase" || txn.action === "refund";
                    return (
                      <div key={txn.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {txn.reason || (txn.action === "purchase" ? "Credit purchase" : txn.action === "deduct" ? "Quote check" : txn.action)}
                          </p>
                          {txn.amount_paid_aud && (
                            <p className="text-xs text-slate-400">Paid A${txn.amount_paid_aud.toFixed(2)}</p>
                          )}
                          <p className="text-xs text-slate-400">{txn.created_date ? format(new Date(txn.created_date), "d MMM yyyy, h:mm a") : ""}</p>
                        </div>
                        <span className={`text-sm font-bold ml-3 flex-shrink-0 ${isAdd ? "text-emerald-600" : "text-red-500"}`}>
                          {isAdd ? "+" : "-"}{txn.amount}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
          {tab === "earn" && (

            <motion.div
              key="earn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="p-5 space-y-4"
            >
              {/* Credit explainer */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 text-center font-medium">
                <span className="font-bold text-slate-900">5 credits</span> = 1 quote check · 1 estimate · 1 used car check
              </div>

              {/* --- Referral --- */}
              <ReferralSection onCreditsUpdated={() => { window.dispatchEvent(new Event("credits-updated")); }} />

              {/* --- Upload receipt --- */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-bold text-slate-900">Upload a Receipt — Get 2 Credits <span className="text-xs font-normal text-slate-400">(twice/month)</span></p>
                </div>
                <div className="space-y-1.5">
                  {[
                    "Service data extracted & added to your Logbook",
                    "Odometer & vehicle equity refreshed automatically",
                    "+2 free credits per upload — up to twice per month",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      <p className="text-xs text-slate-600">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 flex items-start gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-emerald-800">AI extracts data only — original image is permanently discarded. No name or payment details stored.</p>
                </div>
                <Button
                  onClick={() => { onClose(); setShowUploadEarn(true); }}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                >
                  <Receipt className="h-4 w-4" /> Upload Receipt & Earn 2 Credits
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

      {showUploadEarn && (
        <UploadToEarnModal
          onClose={() => setShowUploadEarn(false)}
          onSuccess={(total) => { onSuccess?.(total); setShowUploadEarn(false); }}
        />
      )}
      </motion.div>
    </div>
  );
}