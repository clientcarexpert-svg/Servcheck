import { useState, useEffect } from "react";
import { Home as HomeIcon } from "lucide-react";
import SEOHead from "../components/SEOHead";
import MechanicVerificationPending from "../components/MechanicVerificationPending";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Wrench, Bell, Star, LogOut, ChevronRight, Loader2, Zap, CheckCircle, MessageSquare, Shield, Clock, CalendarCheck, SlidersHorizontal, X
} from "lucide-react";
import LiveLeadsFeed from "../components/LiveLeadsFeed";
import VerificationUploadTab from "../components/VerificationUploadTab";
import DirectMessageThread from "../components/DirectMessageThread";
import MechanicPerformance from "../components/MechanicPerformance";
import AvailabilityBookingTab from "../components/AvailabilityBookingTab";
import LeadPreferencesSection from "../components/LeadPreferencesSection";
import BookingCalendar from "../components/BookingCalendar";
import { toast } from "sonner";
import { format } from "date-fns";
import { TrendingUp } from "lucide-react";

const ALL_TABS = ["Live Leads", "My Leads", "Performance", "Bookings", "Messages", "My Profile"];
const UNVERIFIED_EXTRA_TAB = "Verification";

export default function MechanicPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [tab, setTab] = useState("Live Leads");
  const [loading, setLoading] = useState(true);
  const [openQuoteRequestId, setOpenQuoteRequestId] = useState(null);
  
  // Respond to URL param changes from hamburger menu
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("tab") === "profile") {
      setTab("My Profile");
    } else if (location.pathname === "/mechanic-portal" && !params.get("tab")) {
      // Clicking "Home" link (no tab param) — reset to Live Leads
      setTab("Live Leads");
    }
  }, [location.search, location.key]);

  useEffect(() => { loadPortal(); }, []);

  const loadPortal = async () => {
    setLoading(true);
    try {
      const u = await base44.auth.me();
      if (!u) { navigate("/"); return; }
      setUser(u);
      const profiles = await base44.entities.MechanicProfile.filter({ user_email: u.email });
      if (profiles.length === 0) { navigate("/mechanic-signup"); return; }
      const p = profiles[0];
      setProfile(p);
      const notifs = await base44.entities.MechanicNotification.filter({ mechanic_profile_id: p.id }, "-created_date", 50);
      setNotifications(notifs);
    } catch {
      toast.error("Failed to load portal");
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (notif) => {
    if (notif.is_read) return;
    await base44.entities.MechanicNotification.update(notif.id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
  };

  const deleteNotification = async (e, notifId) => {
    e.stopPropagation();
    await base44.entities.MechanicNotification.delete(notifId);
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  };

  const handleUpgrade = async (plan) => {
    if (window.self !== window.top) {
      alert("Checkout only works from the published app, not the editor preview.");
      return;
    }
    try {
      const res = await base44.functions.invoke("createMechanicCheckout", { plan });
      window.location.href = res.data.url;
    } catch {
      toast.error("Could not start checkout. Please try again.");
    }
  };

  // Listen for profile tab navigation
  useEffect(() => {
    const handler = () => setTab("My Profile");
    window.addEventListener("goto-profile", handler);
    return () => window.removeEventListener("goto-profile", handler);
  }, []);

  // Listen for messages tab navigation (from header icon)
  useEffect(() => {
    const handler = () => setTab("Messages");
    window.addEventListener("mechanic-go-bookings", handler);
    return () => window.removeEventListener("mechanic-go-bookings", handler);
  }, []);

  const isVerified = profile?.verification_status === "verified";
  const TABS = isVerified
    ? ALL_TABS
    : ALL_TABS.filter(t => t !== "My Profile").concat([UNVERIFIED_EXTRA_TAB, "My Profile"]);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  // No more full-page gate — all mechanics see the portal

  return (
    <div className="flex flex-col h-screen bg-background">
      <SEOHead title="Mechanic Portal" description="Your mechanic portal." path="/mechanic-portal" noindex={true} />
      
      {/* Compact Header */}
      <div className="border-b border-border px-4 py-3 flex-shrink-0 bg-card">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Wrench className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-heading font-bold text-xs truncate">{profile?.business_name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{profile?.subscription_tier === "featured" ? "⭐ Featured" : profile?.subscription_tier || "Free"}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => base44.auth.logout("/")} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        {!isVerified && (
          <div className="mt-2 text-[10px] bg-amber-50 text-amber-800 px-2 py-1.5 rounded border border-amber-200">
            ⏳ Verification in progress (~48 hours)
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-40">

        {/* Live Leads Tab */}
        {tab === "Live Leads" && profile && (
          <LiveLeadsFeed profile={profile} isVerified={isVerified} onClaimSuccess={() => setTab("My Leads")} onGoVerify={() => setTab("Verification")} />
        )}

        {/* My Leads Tab */}
        {tab === "My Leads" && profile && (
          isVerified ? (
            <LiveLeadsFeed profile={profile} isVerified showClaimedOnly onClaimSuccess={() => {}} />
          ) : (
            <div className="text-center py-16 space-y-3">
              <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto" />
              <div>
                <p className="font-semibold text-sm">Claimed Leads</p>
                <p className="text-xs text-muted-foreground mt-1">Get verified to claim leads — they'll appear here</p>
              </div>
            </div>
          )
        )}

        {/* Performance Tab */}
        {tab === "Performance" && profile && (
          <MechanicPerformance profile={profile} />
        )}

        {/* Bookings Tab */}
        {tab === "Bookings" && profile && (
          <div className="space-y-5">
            <div>
              <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4" /> Job Calendar
              </h3>
              <BookingCalendar profile={profile} />
            </div>
            <div className="border-t border-border pt-5">
              <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Availability Settings
              </h3>
              <AvailabilityBookingTab profile={profile} onUpdate={() => loadPortal()} />
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {tab === "Messages" && profile && (
          <div className="space-y-3">
            {!openQuoteRequestId ? (
              <>
                <h3 className="font-heading font-bold text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4" /> Messages {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                </h3>
                {notifications.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        className={`relative rounded-lg border text-xs transition-all ${n.is_read ? "bg-card border-border opacity-60" : "bg-accent/5 border-accent/40"}`}
                      >
                        <button
                          onClick={() => { markRead(n); if (n.quote_request_id) setOpenQuoteRequestId(n.quote_request_id); }}
                          className="w-full text-left p-3 pr-9"
                        >
                          <div className="flex items-start gap-2">
                            <p className={`font-medium truncate flex-1 ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                            {!n.is_read && <span className="h-2 w-2 rounded-full bg-accent flex-shrink-0 mt-1" />}
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-1">{(n.message || "").replace(/view in live leads/gi, "").trim()}</p>
                        </button>
                        <button
                          onClick={(e) => deleteNotification(e, n.id)}
                          className="absolute top-2 right-2 h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <DirectMessageThread quoteRequestId={openQuoteRequestId} profile={profile} onBack={() => setOpenQuoteRequestId(null)} />
            )}
          </div>
        )}

        {/* Verification Tab */}
        {tab === "Verification" && profile && (
          <VerificationUploadTab profile={profile} onSubmitted={() => { loadPortal(); }} />
        )}

        {/* My Profile Tab */}
        {tab === "My Profile" && profile && (
          <div className="space-y-5 pt-3">
            <div>
              <button
                onClick={() => setTab("Live Leads")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
              >
                <ChevronRight className="h-4 w-4 rotate-180" /> Back
              </button>
              <h3 className="font-heading font-bold text-sm mb-3">Workshop Profile</h3>
              <ProfileEditor profile={profile} onSave={(updated) => { setProfile(updated); }} />
            </div>
            <div className="border-t border-border pt-5">
              <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" /> Lead Preferences
              </h3>
              <LeadPreferencesSection profile={profile} onUpdate={() => loadPortal()} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-700 bg-slate-900 safe-area-inset-bottom z-50 shadow-xl">
        <div className="flex items-stretch h-[72px]">
          {TABS.filter(t => t !== "Verification" || !isVerified).map(t => {
            const unread = t === "Messages" ? unreadCount : 0;
            const isActive = tab === t;

            const CONFIG = {
              "Live Leads":   { icon: <Zap className="h-5 w-5" />,          activeColor: "text-blue-400",   activeBorder: "border-blue-400",   activeBg: "bg-blue-500/15" },
              "My Leads":     { icon: <MessageSquare className="h-5 w-5" />, activeColor: "text-green-400",  activeBorder: "border-green-400",  activeBg: "bg-green-500/15" },
              "Performance":  { icon: <TrendingUp className="h-5 w-5" />,    activeColor: "text-purple-400", activeBorder: "border-purple-400", activeBg: "bg-purple-500/15" },
              "Bookings":     { icon: <CalendarCheck className="h-5 w-5" />, activeColor: "text-orange-400", activeBorder: "border-orange-400", activeBg: "bg-orange-500/15" },
              "Messages":     { icon: <Bell className="h-5 w-5" />,          activeColor: "text-red-400",    activeBorder: "border-red-400",    activeBg: "bg-red-500/15" },
              "My Profile":   { icon: <HomeIcon className="h-5 w-5" />,      activeColor: "text-white",      activeBorder: "border-white",      activeBg: "bg-white/10" },
              "Verification": { icon: <Shield className="h-5 w-5" />,        activeColor: "text-amber-400",  activeBorder: "border-amber-400",  activeBg: "bg-amber-500/15" },
            };
            const cfg = CONFIG[t] || CONFIG["My Profile"];

            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all relative border-t-2 ${
                  isActive
                    ? `${cfg.activeBg} ${cfg.activeBorder}`
                    : "border-transparent hover:bg-white/5"
                }`}
              >
                <div className={`transition-colors duration-200 ${isActive ? cfg.activeColor : "text-slate-400"}`}>
                  {cfg.icon}
                </div>
                <span className={`text-[10px] font-semibold leading-tight transition-colors ${
                  isActive ? cfg.activeColor : "text-slate-400"
                }`}>{t}</span>
                {unread > 0 && (
                  <span className="absolute top-1 right-2 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProfileEditor({ profile, onSave }) {
  const [form, setForm] = useState({ ...profile });
  const [loading, setLoading] = useState(false);
  const [customSpecialty, setCustomSpecialty] = useState("");
  const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
  const SPECIALTIES = [
    "Logbook Service", "Brake Repairs", "Engine Diagnostics", "Suspension & Steering",
    "Electrical", "Air Conditioning", "Transmission", "Exhaust", "Tyres & Wheels",
    "Pre-Purchase Inspections", "4WD Specialist", "EV / Hybrid", "Fleet", "European Cars"
  ];
  // Track custom specialties so they stay visible even when toggled off
  const [customSpecialties, setCustomSpecialties] = useState(
    () => (profile.specialties || []).filter(s => !SPECIALTIES.includes(s))
  );

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleSpecialty = (s) => {
    setForm(p => ({
      ...p,
      specialties: (p.specialties || []).includes(s)
        ? (p.specialties || []).filter(x => x !== s)
        : [...(p.specialties || []), s]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke('updateMyMechanicProfile', { profile_id: profile.id, updates: form });
      onSave(form);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Business Name</Label>
          <Input value={form.business_name || ""} onChange={e => update("business_name", e.target.value)} className="h-11 bg-secondary/50 border-0" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
          <Input value={form.phone || ""} onChange={e => update("phone", e.target.value)} className="h-11 bg-secondary/50 border-0" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">ABN</Label>
          <Input value={form.abn || ""} onChange={e => update("abn", e.target.value)} className="h-11 bg-secondary/50 border-0" />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Street Address</Label>
          <Input value={form.address || ""} onChange={e => update("address", e.target.value)} className="h-11 bg-secondary/50 border-0" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Suburb</Label>
          <Input value={form.suburb || ""} onChange={e => update("suburb", e.target.value)} className="h-11 bg-secondary/50 border-0" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">State</Label>
          <Select value={form.state} onValueChange={v => update("state", v)}>
            <SelectTrigger className="h-11 bg-secondary/50 border-0"><SelectValue /></SelectTrigger>
            <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">About Your Business</Label>
          <textarea
            value={form.bio || ""}
            onChange={e => update("bio", e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-secondary/50 border-0 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Specialties</Label>
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map(s => (
            <button key={s} type="button" onClick={() => toggleSpecialty(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                (form.specialties || []).includes(s)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary border-border text-muted-foreground hover:border-primary/50"
              }`}
            >{s}</button>
          ))}
          {/* Show custom specialties — always visible even when toggled off */}
          {customSpecialties.map(s => (
            <button key={s} type="button" onClick={() => toggleSpecialty(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                (form.specialties || []).includes(s)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary border-border text-muted-foreground hover:border-primary/50"
              }`}
            >{s}</button>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Input
            value={customSpecialty}
            onChange={e => setCustomSpecialty(e.target.value)}
            placeholder="Add your own specialty..."
            className="h-9 bg-secondary/50 border-0 text-sm flex-1"
            onKeyDown={e => {
              if (e.key === "Enter" && customSpecialty.trim()) {
                e.preventDefault();
                const val = customSpecialty.trim();
                if (!SPECIALTIES.includes(val) && !customSpecialties.includes(val)) {
                  setCustomSpecialties(prev => [...prev, val]);
                }
                if (!(form.specialties || []).includes(val)) {
                  toggleSpecialty(val);
                }
                setCustomSpecialty("");
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs"
            disabled={!customSpecialty.trim()}
            onClick={() => {
              const val = customSpecialty.trim();
              if (val) {
                if (!SPECIALTIES.includes(val) && !customSpecialties.includes(val)) {
                  setCustomSpecialties(prev => [...prev, val]);
                }
                if (!(form.specialties || []).includes(val)) {
                  toggleSpecialty(val);
                }
              }
              setCustomSpecialty("");
            }}
          >Add</Button>
        </div>
      </div>
      <Button onClick={handleSave} disabled={loading} className="w-full h-11 font-heading font-bold bg-accent text-accent-foreground hover:bg-accent/90">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
      </Button>
    </div>
  );
}