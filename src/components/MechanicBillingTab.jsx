import { useState, useEffect } from "react";
import { CheckCircle, Star, Zap, AlertTriangle, X, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    price: "$29.99",
    amount: "29.99",
    period: "/month",
    color: "border-blue-300 bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
    icon: <Zap className="h-5 w-5 text-blue-600" />,
    perks: [
      "Unlimited lead unlocks per month",
      "See all leads (after the 3-min Featured exclusive window)",
      "No per-lead charges — flat monthly fee",
      "Cancel anytime — instantly, no hoops",
    ],
  },
  {
    key: "featured",
    name: "Featured",
    price: "$49.99",
    amount: "49.99",
    period: "/month",
    color: "border-amber-400 bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    buttonClass: "bg-amber-500 hover:bg-amber-600 text-white",
    icon: <Star className="h-5 w-5 fill-amber-400 text-amber-400" />,
    highlight: true,
    perks: [
      "Everything in Starter",
      "3-minute exclusive first-look on every new lead",
      "Other mechanics can't see the lead until window closes",
      '"Featured" badge on your directory listing',
      "Appear higher in mechanic search results",
      "Cancel anytime — instantly, no hoops",
    ],
  },
];

function ConsentModal({ plan, onConfirm, onClose }) {
  const [authorised, setAuthorised] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!authorised) return;
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-heading font-bold text-lg">Confirm Subscription</p>
            <p className="text-xs text-muted-foreground mt-0.5">{plan.name} Plan — {plan.price}/month</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl bg-secondary/50 border border-border p-4 text-sm space-y-2">
          <p className="font-semibold text-foreground">What you're signing up for:</p>
          <ul className="space-y-1.5">
            {plan.perks.map(p => (
              <li key={p} className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* ACCC-compliant authorisation checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div
            onClick={() => setAuthorised(v => !v)}
            className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
              authorised ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"
            }`}
          >
            {authorised && <CheckCircle className="h-3.5 w-3.5 text-primary-foreground" />}
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            I authorise ServCheck to charge <strong>{plan.price} AUD per month</strong> to my payment method on a recurring basis until I cancel. I understand I can cancel at any time from the Billing tab in my portal with immediate effect.
          </p>
        </label>

        <Button
          onClick={handleConfirm}
          disabled={!authorised || loading}
          className="w-full h-11 font-heading font-bold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Redirecting to payment...
            </span>
          ) : (
            `Proceed to Payment — ${plan.price}/mo`
          )}
        </Button>
        <p className="text-[10px] text-center text-muted-foreground">
          Secure payment via Stripe. You will be redirected to Stripe's hosted checkout.
        </p>
      </div>
    </div>
  );
}

function CancelModal({ plan, endDate, onConfirm, onClose }) {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-heading font-bold text-lg text-destructive">Cancel Subscription</p>
            <p className="text-xs text-muted-foreground mt-0.5">{plan?.name} Plan</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Your subscription will <strong>not renew</strong>.
            {endDate && <> It ends on <strong>{endDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</strong>.</>}
            {" "}You keep full access to {plan?.name} features until then and <strong>will not be charged again</strong>.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer group">
          <div
            onClick={() => setConfirmed(v => !v)}
            className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
              confirmed ? "bg-destructive border-destructive" : "border-border group-hover:border-destructive/50"
            }`}
          >
            {confirmed && <CheckCircle className="h-3.5 w-3.5 text-white" />}
          </div>
          <p className="text-xs text-foreground">Yes, I want to cancel — I understand I keep access until the end of my current billing period.</p>
        </label>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 h-10 text-sm">Keep Plan</Button>
          <Button
            onClick={handleCancel}
            disabled={!confirmed || loading}
            className="flex-1 h-10 text-sm font-bold bg-destructive hover:bg-destructive/90 text-white disabled:opacity-40"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Cancel Now"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MechanicBillingTab({ profile, onUpgrade, onCancelSuccess }) {
  const [consentPlan, setConsentPlan] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  // Local copy so we can update cancel_at immediately after cancellation without waiting for parent reload
  const [localProfile, setLocalProfile] = useState(profile);
  const [renewalDate, setRenewalDate] = useState(null);
  const [stripeStatus, setStripeStatus] = useState(null); // live Stripe status

  useEffect(() => { setLocalProfile(profile); }, [profile]);

  const tier = localProfile?.subscription_tier || "free";
  const currentPlan = PLANS.find(p => p.key === tier);

  // Fetch real status from Stripe (renewal date + whether already cancelled)
  useEffect(() => {
    if (tier === "free") return;
    base44.functions.invoke("getMechanicSubscriptionStatus", {}).then(res => {
      if (res.data?.current_period_end) {
        setRenewalDate(new Date(res.data.current_period_end));
      }
      setStripeStatus(res.data);
      // If Stripe says cancel_at_period_end=true but our DB doesn't have it yet, sync locally
      if (res.data?.cancel_at_period_end && res.data?.current_period_end && !localProfile?.subscription_cancel_at) {
        setLocalProfile(prev => ({ ...prev, subscription_cancel_at: res.data.current_period_end }));
      }
    }).catch(() => {});
  }, [tier]);

  const handleUpgradeConfirmed = async () => {
    if (!consentPlan) return;
    // Check if running in iframe (Base44 preview)
    if (window.self !== window.top) {
      toast.error("Checkout only works from the published app, not the preview.");
      setConsentPlan(null);
      return;
    }
    try {
      const res = await base44.functions.invoke("createMechanicCheckout", { plan: consentPlan.key });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error(res.data?.error || "Could not start checkout.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Something went wrong.");
    }
    setConsentPlan(null);
  };

  const handleCancelConfirmed = async () => {
    try {
      const res = await base44.functions.invoke("cancelMechanicSubscription", {});
      if (res.data?.success) {
        const cancelAt = res.data.cancel_at || renewalDate?.toISOString();
        const endDateStr = cancelAt
          ? new Date(cancelAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
          : "the end of your billing period";
        toast.success(`Subscription cancelled. You keep full access until ${endDateStr}.`);
        // Immediately reflect in UI — cancel button disappears, end date shows
        setLocalProfile(prev => ({ ...prev, subscription_cancel_at: cancelAt }));
        setStripeStatus(prev => ({ ...prev, cancel_at_period_end: true }));
        setShowCancelModal(false);
        if (onCancelSuccess) onCancelSuccess();
      } else {
        toast.error(res.data?.error || "Could not cancel subscription.");
        setShowCancelModal(false);
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Something went wrong.";
      toast.error(msg);
      console.error("Cancel subscription error:", err);
      setShowCancelModal(false);
    }
  };

  // Free leads calculation
  const resetDate = localProfile?.free_leads_reset_date ? new Date(localProfile.free_leads_reset_date) : null;
  const n = new Date();
  const isNewMonth = !resetDate || resetDate.getMonth() !== n.getMonth() || resetDate.getFullYear() !== n.getFullYear();
  const used = isNewMonth ? 0 : (localProfile?.free_leads_used || 0);
  const freeLeft = Math.max(0, 10 - used);

  return (
    <div className="space-y-6">
      {/* Modals */}
      {consentPlan && (
        <ConsentModal
          plan={consentPlan}
          onConfirm={handleUpgradeConfirmed}
          onClose={() => setConsentPlan(null)}
        />
      )}
      {showCancelModal && (
        <CancelModal
          plan={currentPlan}
          endDate={renewalDate}
          onConfirm={handleCancelConfirmed}
          onClose={() => setShowCancelModal(false)}
        />
      )}

      {/* Current plan banner */}
      {tier !== "free" && currentPlan && (() => {
        const isCancelled = !!(localProfile?.subscription_cancel_at || stripeStatus?.cancel_at_period_end);
        const endDate = localProfile?.subscription_cancel_at
          ? new Date(localProfile.subscription_cancel_at)
          : renewalDate;
        const endDateStr = endDate
          ? endDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
          : null;

        return (
          <div className={`rounded-xl border-2 p-4 space-y-3 ${currentPlan.color}`}>
            <div className="flex items-center gap-3">
              {currentPlan.icon}
              <div className="flex-1">
                <p className="font-heading font-bold text-sm">
                  You're on the <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${currentPlan.badge}`}>{currentPlan.name}</span> plan
                </p>
                <p className="text-xs font-semibold mt-0.5 text-foreground">{currentPlan.price}/month</p>
              </div>
            </div>

            {isCancelled ? (
              <div className="rounded-lg bg-amber-100 border border-amber-300 px-3 py-2.5 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800">Cancellation scheduled</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {endDateStr
                      ? <>Your subscription ends on <strong>{endDateStr}</strong>. You keep full access until then and won't be charged again.</>
                      : <>Your subscription won't renew. You keep full access until the end of your current billing period.</>
                    }
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-lg bg-white/60 border border-white/80 px-3 py-2.5 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-foreground uppercase tracking-wide">Next Renewal</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {renewalDate
                        ? <>Renews on <strong className="text-foreground">{renewalDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</strong></>
                        : "Loading renewal date..."}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(true)}
                  className="w-full h-9 text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/5 hover:border-destructive"
                >
                  Cancel Subscription
                </Button>
              </>
            )}
          </div>
        );
      })()}

      {/* Free leads tracker — only shown on free tier */}
      {tier === "free" && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Free Lead Unlocks This Month</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(freeLeft / 10) * 100}%` }} />
            </div>
            <span className="text-sm font-bold text-foreground tabular-nums">{freeLeft} / 10</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">One-time signup bonus. Once used, unlock leads with credits or upgrade to a paid plan.</p>
        </div>
      )}

      {/* Plan cards */}
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Plans</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLANS.map(plan => {
          const isCurrentPlan = tier === plan.key;
          const isDowngrade = tier === "featured" && plan.key === "starter";
          return (
            <div
              key={plan.key}
              className={`rounded-xl border-2 p-5 space-y-4 relative ${plan.color} ${plan.highlight ? "shadow-lg" : ""}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">Most Popular</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {plan.icon}
                <p className="font-heading font-bold text-base">{plan.name}</p>
              </div>
              <div>
                <span className="font-heading font-black text-3xl">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-2">
                {plan.perks.map(perk => (
                  <li key={perk} className="flex items-start gap-2 text-xs text-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {perk}
                  </li>
                ))}
              </ul>
              {isCurrentPlan ? (
                <div className="w-full h-10 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                  ✓ Current Plan
                </div>
              ) : isDowngrade ? (
                <div className="w-full h-10 rounded-lg bg-secondary flex items-center justify-center text-xs font-semibold text-muted-foreground">
                  Included in Featured
                </div>
              ) : (
                <Button
                  onClick={() => setConsentPlan(plan)}
                  className={`w-full h-10 font-heading font-bold text-sm gap-2 ${plan.buttonClass}`}
                >
                  {plan.icon} Get {plan.name} — {plan.price}/mo
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Free tier note */}
      {tier === "free" && (
        <div className="rounded-xl border border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">You're on the Free plan</p>
          <p>Use your {freeLeft} remaining free unlocks, then unlock leads with credits (2 per lead) or upgrade to a plan for unlimited unlocks.</p>
        </div>
      )}

      {/* Legal footer */}
      <p className="text-[10px] text-muted-foreground text-center pb-2">
        Subscriptions are billed monthly and renew automatically. Cancel at any time from this page with immediate effect. By subscribing you agree to ServCheck's Terms of Service.
      </p>
    </div>
  );
}