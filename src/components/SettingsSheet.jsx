import { useState, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LogOut, Save, CreditCard, User, ShieldCheck,
  ChevronDown, Bell, AlertTriangle,
  X, Settings, LayoutDashboard, Zap, Loader2, Users, CheckCircle2, XCircle, Sparkles, LifeBuoy, Mail
} from "lucide-react";
import ReferralSection from "./ReferralSection";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useState as useStateLocal } from "react";
import { toast } from "sonner";
import { getCredits, CREDITS_PER_CHECK, CREDIT_PACKS } from "@/lib/credits";
import { Link } from "react-router-dom";
import { requestNotificationPermission } from "@/lib/notificationPermission";

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

function DeleteAccountModal({ onClose }) {
  const [reason, setReason] = useState("");
  const [step, setStep] = useState(1);
  const [deleting, setDeleting] = useState(false);
  const reasons = ["No longer need it", "Found alternative", "Privacy concerns", "Too expensive", "Account issues", "Other"];
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" style={{pointerEvents:'all'}}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100" style={{pointerEvents:'all'}}>
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h3 className="font-heading font-bold text-sm text-destructive">{step === 1 ? "Why delete?" : "Confirm deletion"}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{step === 1 ? "Help us improve." : "This cannot be undone. All data will be permanently removed."}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 ml-3"><X className="h-4 w-4" /></button>
        </div>
        {step === 1 ? (
          <div className="p-4 space-y-2">
            {reasons.map(r => (
              <button key={r} onClick={() => setReason(r)} className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${reason === r ? "border-destructive bg-red-50" : "border-slate-200 text-slate-600 hover:border-destructive/50"}`}>{r}</button>
            ))}
            {reason === "Other" && (
              <input placeholder="Tell us more..." value={reason === "Other" ? "" : reason} onChange={e => setReason(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mt-2" />
            )}
            <Button onClick={() => setStep(2)} disabled={!reason} className="w-full h-10 bg-destructive text-white font-semibold text-sm mt-1">Continue</Button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800 flex gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              Account and all associated data will be permanently deleted.
            </div>
            <Button variant="outline" onClick={onClose} disabled={deleting} className="w-full h-10 font-semibold text-sm">Keep Account</Button>
            <Button
              onClick={async () => {
                setDeleting(true);
                try {
                  await base44.functions.invoke('deleteUserAccount', { reason });
                  toast.success('Account deleted.');
                  onClose();
                  setTimeout(() => base44.auth.logout(), 1000);
                } catch (err) {
                  toast.error('Deletion failed. Try again.');
                  setDeleting(false);
                }
              }}
              disabled={deleting}
              className="w-full h-10 bg-destructive hover:bg-red-700 text-white font-semibold text-sm"
            >
              {deleting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function CancelModal({ onClose }) {
  const [reason, setReason] = useState("");
  const [step, setStep] = useState(1);
  const [cancelling, setCancelling] = useState(false);
  const reasons = ["Too expensive", "Not using it enough", "Missing features", "Found a better alternative", "Just testing", "Other"];
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" style={{pointerEvents:'all'}}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100" style={{pointerEvents:'all'}}>
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h3 className="font-heading font-bold text-sm">{step === 1 ? "Why are you leaving?" : "Confirm Cancellation"}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{step === 1 ? "Your feedback helps us improve." : "Your subscription will end at the current billing period."}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 ml-3"><X className="h-4 w-4" /></button>
        </div>
        {step === 1 ? (
          <div className="p-4 space-y-2">
            {reasons.map(r => (
              <button key={r} onClick={() => setReason(r)} className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${reason === r ? "border-slate-900 bg-slate-50" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>{r}</button>
            ))}
            <Button onClick={() => setStep(2)} disabled={!reason} className="w-full h-10 bg-slate-900 text-white font-semibold text-sm mt-1">Continue</Button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              Your subscription will be cancelled at the end of the current billing period. Your credits never expire.
            </div>
            <Button variant="outline" onClick={onClose} disabled={cancelling} className="w-full h-10 font-semibold text-sm">Keep Subscription</Button>
            <Button
              onClick={async () => {
                setCancelling(true);
                try {
                  await base44.functions.invoke('cancelPremiumSubscription', { reason });
                  toast.success("Subscription cancelled. You'll keep access until the end of your billing period.");
                  onClose();
                } catch (err) {
                  const msg = err?.response?.data?.error || err?.message || '';
                  if (msg.includes('No active premium subscription')) {
                    toast.info("No active subscription found to cancel.");
                    onClose();
                  } else {
                    toast.error("Could not cancel subscription. Please try again.");
                  }
                } finally {
                  setCancelling(false);
                }
              }}
              disabled={cancelling}
              className="w-full h-10 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm"
            >
              {cancelling ? "Cancelling..." : "Cancel Subscription"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsSheet({ open, onClose }) {
  const { user: currentUser } = useAuth();
  const [openSection, setOpenSection] = useState(null);
  const [suburb, setSuburb] = useState("");
  const [state, setState] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'short'
  const [saving, setSaving] = useState(false);
  const [credits, setCredits] = useState(getCredits());
  const [showCancel, setShowCancel] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [purchasing, setPurchasing] = useState(null);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(currentUser?.notifications_enabled ?? false);

  useEffect(() => {
    if (currentUser) {
      setSuburb(currentUser.suburb || "");
      setState(currentUser.state || "");
      setUsername(currentUser.username || "");
      setNotificationsEnabled(currentUser.notifications_enabled ?? false);
    }
  }, [currentUser]);

  const checkUsername = async (val) => {
    const trimmed = val.trim();
    if (!trimmed || trimmed === (currentUser?.username || "")) { setUsernameStatus(null); return; }
    if (trimmed.length < 3) { setUsernameStatus('short'); return; }
    setUsernameStatus('checking');
    try {
      const res = await base44.functions.invoke('checkUsernameAvailability', { username: trimmed });
      setUsernameStatus(res.data?.available ? 'available' : 'taken');
    } catch { setUsernameStatus(null); }
  };

  useEffect(() => {
    const refresh = () => setCredits(getCredits());
    window.addEventListener("credits-updated", refresh);
    return () => window.removeEventListener("credits-updated", refresh);
  }, []);

  const toggle = (id) => setOpenSection(prev => prev === id ? null : id);

  const handleSave = async () => {
    if (usernameStatus === 'taken') { toast.error("Username is already taken."); return; }
    if (usernameStatus === 'short') { toast.error("Username must be at least 3 characters."); return; }
    setSaving(true);
    const updates = { suburb, state };
    if (username.trim() && username.trim() !== (currentUser?.username || "")) {
      updates.username = username.trim().toLowerCase();
    }
    await base44.auth.updateMe(updates);
    toast.success("Profile updated.");
    setSaving(false);
  };

  const handlePremiumUpgrade = async () => {
    if (window.self !== window.top) {
      alert("Checkout only works from the published app, not inside the editor preview.");
      return;
    }
    setPremiumLoading(true);
    try {
      const res = await base44.functions.invoke("createSubscriptionCheckout", { plan_id: "premium" });
      if (res.data?.url) window.location.href = res.data.url;
      else toast.error("Could not start checkout. Please try again.");
    } catch {
      toast.error("Could not start checkout. Please try again.");
    } finally {
      setPremiumLoading(false);
    }
  };

  const handlePurchase = async (packId) => {
    if (window.self !== window.top) {
      alert("Checkout only works from the published app, not inside the editor preview.");
      return;
    }
    setPurchasing(packId);
    try {
      const res = await base44.functions.invoke("createCreditsCheckout", { pack_id: packId });
      window.location.href = res.data.url;
    } catch {
      toast.error("Could not start checkout. Please try again.");
      setPurchasing(null);
    }
  };

  const name = currentUser?.full_name || "";
  const email = currentUser?.email || "";
  const initials = name
    ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase();

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className="w-[340px] sm:w-[380px] p-0 flex flex-col overflow-hidden">

          {/* ── Header ── */}
          <div className="flex-shrink-0 relative rounded-b-[2rem]" style={{background: 'linear-gradient(135deg, #f97316 0%, #ea580c 60%, #c2410c 100%)'}}>
            {/* Decorative circles */}
            <div className="absolute top-4 -right-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute top-12 -right-2 w-16 h-16 rounded-full bg-white/5 pointer-events-none" />

            {/* Close + title row */}
            <div className="flex items-center justify-between px-5 pt-8 pb-4 relative">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-white/70" />
                <span className="text-white/90 text-sm font-semibold tracking-wide">Settings</span>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Avatar + name row */}
            <div className="flex items-center gap-4 px-5 pb-10 relative">
              <Avatar className="h-14 w-14 border-2 border-white/30 flex-shrink-0 shadow-lg">
                <AvatarFallback className="text-orange-600 font-heading font-bold text-base" style={{background:'white'}}>
                  {initials || <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-heading font-bold text-white text-base truncate leading-tight">{name || email}</p>
                <p className="text-white/65 text-xs truncate mt-0.5">{email}</p>
                {currentUser?.role === "admin" && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold mt-1">
                    <ShieldCheck className="h-3 w-3" /> Admin
                  </span>
                )}
              </div>
            </div>

            {/* Wave curve at the bottom */}
            <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none pointer-events-none">
              <svg viewBox="0 0 400 24" preserveAspectRatio="none" className="w-full h-6 block" xmlns="http://www.w3.org/2000/svg">
                <path d="M0,0 C100,24 300,24 400,0 L400,24 L0,24 Z" fill="white" />
              </svg>
            </div>
          </div>

          {/* ── Accordion sections ── */}
          <div className="flex-1 overflow-y-auto pb-24">

            {/* Personal Profile */}
            <Section icon={User} label="Personal Profile" open={openSection === "profile"} onToggle={() => toggle("profile")}>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Full Name</Label>
                  <Input value={name} disabled className="h-10 bg-slate-50 border-slate-200 text-sm text-slate-500" />
                  <p className="text-[11px] text-muted-foreground">Managed by your login provider.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Username</Label>
                  <div className="relative">
                    <Input
                      value={username}
                      onChange={e => { setUsername(e.target.value); checkUsername(e.target.value); }}
                      placeholder="e.g. johnsmith"
                      className={`h-10 border-slate-200 text-sm pr-8 ${usernameStatus === 'taken' ? 'border-red-400' : usernameStatus === 'available' ? 'border-green-400' : ''}`}
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      {usernameStatus === 'checking' && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
                      {usernameStatus === 'available' && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                      {usernameStatus === 'taken' && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                    </div>
                  </div>
                  {usernameStatus === 'taken' && <p className="text-[11px] text-red-500">Username already taken.</p>}
                  {usernameStatus === 'available' && <p className="text-[11px] text-green-600">Username available!</p>}
                  {usernameStatus === 'short' && <p className="text-[11px] text-amber-600">Must be at least 3 characters.</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Email Address</Label>
                  <Input value={email} disabled className="h-10 bg-slate-50 border-slate-200 text-sm text-slate-500" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Suburb</Label>
                  <Input value={suburb} onChange={e => setSuburb(e.target.value)} placeholder="e.g. Parramatta" className="h-10 border-slate-200 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">State</Label>
                  <Input value={state} onChange={e => setState(e.target.value)} placeholder="e.g. NSW" className="h-10 border-slate-200 text-sm" />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full h-10 font-semibold gap-2 bg-primary text-sm">
                  <Save className="h-3.5 w-3.5" />{saving ? "Saving…" : "Save Changes"}
                </Button>
                {currentUser?.role === "admin" && (
                  <Link to="/admin" onClick={onClose}>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer mt-1">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                          <LayoutDashboard className="h-3 w-3 text-primary" />
                        </div>
                        <p className="text-xs font-semibold">Admin Panel</p>
                      </div>
                      <ChevronDown className="-rotate-90 h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                )}
              </div>
            </Section>

            {/* Billing */}
            <Section icon={CreditCard} label="Billing" open={openSection === "billing"} onToggle={() => toggle("billing")}>
              {/* Premium subscription */}
              <div className="rounded-2xl overflow-hidden border border-slate-200">
                <div className="px-4 py-4 text-center" style={{ background: "#0A0F2C" }}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-[#f97316]" />
                    <h3 className="font-heading font-extrabold text-sm text-white">Premium Subscription</h3>
                  </div>
                  <p className="text-slate-400 text-xs mb-2">Car Buyer Check · Equity Meter · 75 credits/month</p>
                  <div className="inline-flex items-end gap-1 bg-white/10 rounded-xl px-3 py-1.5">
                    <span className="font-heading font-black text-xl text-white">$14.99</span>
                    <span className="text-slate-300 text-xs mb-0.5">/month AUD</span>
                  </div>
                </div>
                <div className="bg-white px-4 py-3">
                  {currentUser?.is_premium && (!currentUser?.premium_expires_at || new Date(currentUser.premium_expires_at) > new Date()) ? (
                    <div className="w-full h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-bold text-emerald-700">Active Premium</span>
                    </div>
                  ) : (
                    <Button
                      onClick={handlePremiumUpgrade}
                      disabled={premiumLoading}
                      className="w-full h-9 bg-[#f97316] hover:bg-[#ea6c0a] text-white font-bold text-xs rounded-xl gap-2"
                    >
                      {premiumLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                        <><Sparkles className="h-3.5 w-3.5" /> Upgrade to Premium · Cancel anytime</>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Credit balance */}
              <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-4 text-white">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Available Credits</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-heading font-bold text-4xl">{credits}</p>
                    <p className="text-[11px] text-white/60 mt-0.5">{CREDITS_PER_CHECK} per check · Never expire</p>
                  </div>
                  <Zap className="h-8 w-8 text-white/20" />
                </div>
              </div>

              {/* Credit packs */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Top Up Credits</p>
                <div className="space-y-2.5">
                  {CREDIT_PACKS.map(pack => (
                    <div key={pack.id} className={`rounded-xl border-2 p-3.5 relative ${pack.popular ? "border-accent bg-accent/5" : "border-slate-200"}`}>
                      {pack.popular && (
                        <span className="absolute -top-px right-3 text-[10px] bg-accent text-white px-2 py-0.5 rounded-b-lg font-bold uppercase tracking-wide">Popular</span>
                      )}
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{pack.label}</p>
                          <p className="text-[11px] text-muted-foreground">{pack.credits} credits · {pack.tagline}</p>
                        </div>
                        <p className="font-heading font-bold text-base text-slate-900 flex-shrink-0">{pack.price}</p>
                      </div>
                      <Button
                        onClick={() => handlePurchase(pack.id)}
                        disabled={purchasing === pack.id}
                        className={`w-full h-9 text-xs font-bold gap-1.5 ${pack.popular ? "bg-accent hover:bg-accent/90 text-white" : "bg-primary hover:bg-primary/90 text-white"}`}
                      >
                        {purchasing === pack.id ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Redirecting…</> : `Buy ${pack.credits} credits — ${pack.price}`}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-start gap-2">
                <CreditCard className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">Payments processed securely by Stripe. No card details stored. Credits never expire.</p>
              </div>

              <button onClick={() => setShowCancel(true)} className="w-full text-xs text-muted-foreground hover:text-red-600 transition-colors py-1 text-center font-medium">
                Cancel account / leave feedback
              </button>
              <button onClick={() => setShowDelete(true)} className="w-full text-xs text-destructive hover:text-red-700 transition-colors py-2 text-center font-semibold border-t border-slate-200 mt-3 pt-3">
                Delete Account Permanently
              </button>
            </Section>

            {/* Referral */}
            <Section icon={Users} label="Refer a Friend" open={openSection === "referral"} onToggle={() => toggle("referral")}>
              <ReferralSection onCreditsUpdated={(c) => { setCredits(c); }} />
            </Section>

            {/* App Settings */}
            <Section icon={Settings} label="App Settings" open={openSection === "settings"} onToggle={() => toggle("settings")}>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0"><Bell className="h-3.5 w-3.5 text-slate-600" /></div>
                    <div>
                      <p className="text-xs font-semibold">Phone Notifications</p>
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
                    className={`px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors ${
                      notificationsEnabled
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-primary hover:bg-primary/90'
                    }`}
                  >
                    {notificationsEnabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                {[["Version", "1.0.0"], ["Region", "Australia"], ["Currency", "AUD"]].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs"><span className="text-muted-foreground">{k}</span><span className="font-semibold text-slate-700">{v}</span></div>
                ))}
              </div>
            </Section>



            {/* Support */}
            <Section icon={LifeBuoy} label="Support" open={openSection === "support"} onToggle={() => toggle("support")}>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Need help? Our support team is here for you. Send us an email and we'll get back to you within 48 hours.
                </p>
                <a
                  href="mailto:support@servcheck.com.au"
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => { e.stopPropagation(); window.location.href = 'mailto:support@servcheck.com.au'; }}
                  className="flex items-center gap-3 w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors px-4 py-3"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Email Support</p>
                    <p className="text-[11px] text-muted-foreground">support@servcheck.com.au</p>
                  </div>
                </a>
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

          </div>
        </SheetContent>
      </Sheet>

      {showCancel && <CancelModal onClose={() => setShowCancel(false)} />}
      {showDelete && <DeleteAccountModal onClose={() => setShowDelete(false)} />}
    </>
  );
}