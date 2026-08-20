import { useState, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LogOut, CreditCard, User, ChevronDown, Bell,
  X, Settings, Wrench, Star, Zap, AlertTriangle, CheckCircle, CalendarCheck
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { requestNotificationPermission } from "@/lib/notificationPermission";
import AvailabilityBookingTab from "./AvailabilityBookingTab";

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    price: "$29.99",
    period: "/month",
    color: "border-blue-300 bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
    icon: <Zap className="h-4 w-4 text-blue-600" />,
    perks: [
      "Unlimited lead unlocks per month",
      "See all leads after the 3-min exclusive window",
      "No per-lead charges — flat monthly fee",
      "Cancel anytime",
    ],
  },
  {
    key: "featured",
    name: "Featured",
    price: "$49.99",
    period: "/month",
    color: "border-amber-400 bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    buttonClass: "bg-amber-500 hover:bg-amber-600 text-white",
    highlight: true,
    icon: <Star className="h-4 w-4 fill-amber-400 text-amber-400" />,
    perks: [
      "Everything in Starter",
      "3-min exclusive first-look on every new lead",
      '"Featured" badge on your listing',
      "Higher placement in search results",
      "Cancel anytime",
    ],
  },
];

function Section({ icon: Icon, label, open, onToggle, children }) {
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${open ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className={`text-sm font-semibold ${open ? "text-primary" : "text-slate-800"}`}>{label}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4 animate-in slide-in-from-top-1 duration-150">
          {children}
        </div>
      )}
    </div>
  );
}

function ConsentModal({ plan, onConfirm, onClose }) {
  const [authorised, setAuthorised] = useState(false);
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-heading font-bold text-lg">Confirm Subscription</p>
            <p className="text-xs text-muted-foreground mt-0.5">{plan.name} Plan — {plan.price}/month</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>
        <ul className="space-y-1.5 bg-slate-50 rounded-xl p-4">
          {plan.perks.map(p => (
            <li key={p} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />{p}
            </li>
          ))}
        </ul>
        <label className="flex items-start gap-3 cursor-pointer">
          <div
            onClick={() => setAuthorised(v => !v)}
            className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${authorised ? "bg-primary border-primary" : "border-slate-300"}`}
          >
            {authorised && <CheckCircle className="h-3.5 w-3.5 text-white" />}
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            I authorise ServCheck to charge <strong>{plan.price} AUD/month</strong> until I cancel. I can cancel anytime from my portal.
          </p>
        </label>
        <Button
          onClick={async () => { setLoading(true); await onConfirm(); setLoading(false); }}
          disabled={!authorised || loading}
          className="w-full h-11 font-heading font-bold bg-primary text-white"
        >
          {loading ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Redirecting...</span> : `Proceed to Payment — ${plan.price}/mo`}
        </Button>
      </div>
    </div>
  );
}

function CancelModal({ plan, endDate, onConfirm, onClose }) {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const endDateStr = endDate
    ? endDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-heading font-bold text-lg text-destructive">Cancel Subscription</p>
            <p className="text-xs text-muted-foreground mt-0.5">{plan?.name} Plan</p>
          </div>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Your subscription will <strong>not renew</strong>.
            {endDateStr && <> It ends on <strong>{endDateStr}</strong>.</>}
            {" "}You keep full access until then and <strong>will not be charged again</strong>.
          </p>
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <div
            onClick={() => setConfirmed(v => !v)}
            className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${confirmed ? "bg-destructive border-destructive" : "border-slate-300"}`}
          >
            {confirmed && <CheckCircle className="h-3.5 w-3.5 text-white" />}
          </div>
          <p className="text-xs text-slate-700">Yes, I want to cancel — I understand I keep access until the end of my current billing period.</p>
        </label>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 h-10 text-sm">Keep Plan</Button>
          <Button
            onClick={async () => { setLoading(true); await onConfirm(); setLoading(false); }}
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

function CurrentPlanBanner({ plan, profile, renewalDate, onCancel }) {
  const isCancelled = !!profile?.subscription_cancel_at;
  const endDate = profile?.subscription_cancel_at ? new Date(profile.subscription_cancel_at) : renewalDate;
  const endDateStr = endDate
    ? endDate.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
    : null;
  return (
    <div className={`rounded-xl border-2 p-4 ${plan.color}`}>
      <div className="flex items-center gap-2 mb-2">
        {plan.icon}
        <p className="font-heading font-bold text-sm">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${plan.badge}`}>{plan.name}</span> Plan Active
        </p>
      </div>
      {isCancelled ? (
        <div className="rounded-lg bg-amber-100 border border-amber-300 px-3 py-2 text-xs text-amber-800">
          <strong>Cancellation scheduled</strong>
          {endDateStr && <> — access until <strong>{endDateStr}</strong></>}. You won't be charged again.
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-3">
            Billed at {plan.price}/month
            {renewalDate && <> · renews {renewalDate.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</>}.
          </p>
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full h-9 text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/5"
          >
            Cancel Subscription
          </Button>
        </>
      )}
    </div>
  );
}

export default function MechanicSettingsSheet({ open, onClose, defaultSection = null }) {
  const { user } = useAuth();
  const [openSection, setOpenSection] = useState(defaultSection);

  // Re-apply default section every time the sheet opens
  useEffect(() => {
    if (open && defaultSection) setOpenSection(defaultSection);
  }, [open, defaultSection]);
  const [profile, setProfile] = useState(null);
  const [consentPlan, setConsentPlan] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notifications_enabled ?? false);
  const [renewalDate, setRenewalDate] = useState(null);

  const toggle = (id) => setOpenSection(prev => prev === id ? null : id);

  useEffect(() => {
    if (!open || !user) return;
    base44.entities.MechanicProfile.filter({ user_email: user.email }, '-created_date', 1)
      .then(r => { if (r.length > 0) setProfile(r[0]); });
  }, [open, user]);

  useEffect(() => {
    if (!open || !profile || (profile.subscription_tier !== 'starter' && profile.subscription_tier !== 'featured')) return;
    base44.functions.invoke("getMechanicSubscriptionStatus", {}).then(res => {
      if (res.data?.current_period_end) setRenewalDate(new Date(res.data.current_period_end));
    }).catch(() => {});
  }, [open, profile?.subscription_tier]);

  const tier = profile?.subscription_tier || "free";
  const isSubscribed = tier === "starter" || tier === "featured";
  const currentPlan = PLANS.find(p => p.key === tier);

  const resetDate = profile?.free_leads_reset_date ? new Date(profile.free_leads_reset_date) : null;
  const n = new Date();
  const isNewMonth = !resetDate || resetDate.getMonth() !== n.getMonth() || resetDate.getFullYear() !== n.getFullYear();
  const used = isNewMonth ? 0 : (profile?.free_leads_used || 0);
  const freeLeft = Math.max(0, 10 - used);

  const handleUpgrade = async (plan) => {
    if (window.self !== window.top) {
      toast.error("Checkout only works from the published app, not the preview.");
      setConsentPlan(null);
      return;
    }
    try {
      const res = await base44.functions.invoke("createMechanicCheckout", { plan: plan.key });
      if (res.data?.url) window.location.href = res.data.url;
      else toast.error(res.data?.error || "Could not start checkout.");
    } catch {
      toast.error("Something went wrong.");
    }
    setConsentPlan(null);
  };

  const handleCancel = async () => {
    try {
      const res = await base44.functions.invoke("cancelMechanicSubscription", {});
      if (res.data?.success) {
        const cancelAt = res.data.cancel_at || renewalDate?.toISOString();
        const endDateStr = cancelAt
          ? new Date(cancelAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
          : "the end of your billing period";
        toast.success(`Subscription cancelled. You keep full access until ${endDateStr}.`);
        setShowCancelModal(false);
        setProfile(p => p ? { ...p, subscription_cancel_at: cancelAt } : p);
      } else {
        toast.error(res.data?.error || "Could not cancel.");
        setShowCancelModal(false);
      }
    } catch {
      toast.error("Something went wrong.");
      setShowCancelModal(false);
    }
  };

  const name = user?.full_name || "";
  const email = user?.email || "";
  const initials = name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : email.slice(0, 2).toUpperCase();

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className="w-[340px] sm:w-[380px] p-0 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-5 pt-5 pb-5 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Wrench className="h-5 w-5 text-white" />
                <p style={{ color: 'white', fontWeight: '700', fontSize: '18px', fontFamily: 'var(--font-heading)' }}>Mechanic Portal</p>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 border-2 border-white/20 flex-shrink-0">
                <AvatarFallback className="bg-white/10 text-white font-heading font-bold text-sm">
                  {initials || <Wrench className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white text-sm truncate">{profile?.business_name || name || email}</p>
                <p className="text-white/50 text-xs truncate">{email}</p>
              </div>
              <span className={`flex-shrink-0 text-[10px] px-2 py-1 rounded-full font-bold capitalize ${tier === 'featured' ? 'bg-amber-400 text-white' : tier === 'starter' ? 'bg-blue-400 text-white' : 'bg-white/15 text-white'}`}>
                {tier}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-24">

            {/* Workshop Profile */}
            <Section icon={User} label="Workshop Profile" open={openSection === "profile"} onToggle={() => toggle("profile")}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    ["Business", profile?.business_name],
                    ["Type", profile?.mechanic_type?.replace("_", " ")],
                    ["Suburb", profile?.suburb],
                    ["State", profile?.state],
                    ["Phone", profile?.phone],
                    ["ABN", profile?.abn],
                  ].map(([label, val]) => (
                    <div key={label} className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
                      <p className="text-muted-foreground text-[10px] uppercase font-bold mb-0.5">{label}</p>
                      <p className="font-semibold text-slate-800 text-xs truncate">{val || "—"}</p>
                    </div>
                  ))}
                </div>
                <Link to="/mechanic-portal?tab=profile" onClick={onClose}>
                  <Button className="w-full h-10 text-sm font-semibold bg-primary text-white mt-1">
                    Edit Full Profile in Portal
                  </Button>
                </Link>
              </div>
            </Section>

            {/* Subscription & Billing */}
            <Section icon={CreditCard} label="Subscription & Billing" open={openSection === "billing"} onToggle={() => toggle("billing")}>
              <div className="space-y-4">
                {/* Current plan */}
                {tier !== "free" && currentPlan ? (
                  <CurrentPlanBanner
                    plan={currentPlan}
                    profile={profile}
                    renewalDate={renewalDate}
                    onCancel={() => setShowCancelModal(true)}
                  />
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-700">You're on the Free Plan</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">10 free lead unlocks/month. Upgrade for unlimited access.</p>
                  </div>
                )}

                {/* Free leads tracker — free tier only */}
                {!isSubscribed && profile && (
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Free Lead Unlocks This Month</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(freeLeft / 10) * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold tabular-nums">{freeLeft} / 10</span>
                    </div>
                  </div>
                )}

                {/* Plan cards */}
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Upgrade Plan</p>
                <div className="space-y-3">
                  {PLANS.map(plan => {
                    const isCurrent = tier === plan.key;
                    const isDowngrade = tier === "featured" && plan.key === "starter";
                    return (
                      <div key={plan.key} className={`rounded-xl border-2 p-4 ${plan.color}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {plan.icon}
                            <p className="font-heading font-bold text-sm">{plan.name}</p>
                            {plan.highlight && <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">Popular</span>}
                          </div>
                          <p className="font-heading font-bold text-base">{plan.price}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                        </div>
                        <ul className="space-y-1 mb-3">
                          {plan.perks.map(p => (
                            <li key={p} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                              <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" />{p}
                            </li>
                          ))}
                        </ul>
                        {isCurrent ? (
                          <div className="w-full h-9 rounded-lg bg-white/60 flex items-center justify-center text-xs font-bold text-muted-foreground">✓ Current Plan</div>
                        ) : isDowngrade ? (
                          <div className="w-full h-9 rounded-lg bg-white/60 flex items-center justify-center text-xs font-semibold text-muted-foreground">Included in Featured</div>
                        ) : (
                          <Button onClick={() => setConsentPlan(plan)} className={`w-full h-9 text-xs font-bold ${plan.buttonClass}`}>
                            Get {plan.name} — {plan.price}/mo
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <p className="text-[10px] text-muted-foreground text-center">
                  Subscriptions renew monthly. Cancel anytime with immediate effect. Payments via Stripe.
                </p>
              </div>
            </Section>

            {/* Booking & Availability — Full Tab */}
            {openSection === "booking" && (
              <div className="px-5 py-6 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarCheck className="h-5 w-5 text-primary" />
                  <p className="font-heading font-bold text-lg">Booking & Availability</p>
                </div>
                <AvailabilityBookingTab profile={profile} onUpdate={() => {
                  base44.entities.MechanicProfile.filter({ user_email: user.email }, '-created_date', 1)
                    .then(r => { if (r.length > 0) setProfile(r[0]); });
                }} />
              </div>
            )}

            {/* Other Sections — only show when not viewing booking tab */}
            {openSection !== "booking" && (
              <>
                {/* App Settings */}
                <Section icon={Settings} label="App Settings" open={openSection === "settings"} onToggle={() => toggle("settings")}>
                  <div className="space-y-3">
                    {/* Accepting bookings toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${profile?.accepting_bookings !== false ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                          <CalendarCheck className={`h-3.5 w-3.5 ${profile?.accepting_bookings !== false ? 'text-emerald-600' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold">Accepting New Bookings</p>
                          <p className="text-[11px] text-muted-foreground">
                            {profile?.accepting_bookings !== false ? 'You will receive new leads' : 'Leads paused — you\'re fully booked'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (!profile) return;
                          const newVal = profile.accepting_bookings === false ? true : false;
                          await base44.functions.invoke('updateMyMechanicProfile', { profile_id: profile.id, updates: { accepting_bookings: newVal } });
                          setProfile(p => ({ ...p, accepting_bookings: newVal }));
                          toast.success(newVal ? 'Now accepting new bookings' : 'Lead delivery paused');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors ${profile?.accepting_bookings !== false ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400 hover:bg-slate-500'}`}
                      >
                        {profile?.accepting_bookings !== false ? 'On' : 'Off'}
                      </button>
                    </div>

                    {/* Lead notifications toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0"><Bell className="h-3.5 w-3.5 text-slate-600" /></div>
                        <div>
                          <p className="text-xs font-semibold">Lead Notifications</p>
                          <p className="text-[11px] text-muted-foreground">{notificationsEnabled ? 'Enabled' : 'Disabled'}</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (!notificationsEnabled) {
                            const granted = await requestNotificationPermission();
                            if (granted) {
                              setNotificationsEnabled(true);
                              await base44.auth.updateMe({ notifications_enabled: true });
                            }
                          } else {
                            setNotificationsEnabled(false);
                            await base44.auth.updateMe({ notifications_enabled: false });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors ${notificationsEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'}`}
                      >
                        {notificationsEnabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                      {[["Version", "1.0.0"], ["Region", "Australia"], ["Currency", "AUD"]].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs"><span className="text-muted-foreground">{k}</span><span className="font-semibold text-slate-700">{v}</span></div>
                      ))}
                    </div>
                  </div>
                </Section>

                {/* Logout */}
                <div className="px-5 py-4 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    onClick={() => base44.auth.logout()}
                    className="w-full gap-2 text-slate-500 hover:text-red-600 hover:bg-red-50 h-10 text-sm font-semibold border border-slate-200"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {consentPlan && <ConsentModal plan={consentPlan} onConfirm={() => handleUpgrade(consentPlan)} onClose={() => setConsentPlan(null)} />}
      {showCancelModal && <CancelModal plan={currentPlan} endDate={renewalDate} onConfirm={handleCancel} onClose={() => setShowCancelModal(false)} />}
    </>
  );
}