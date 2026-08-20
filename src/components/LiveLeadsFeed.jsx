import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Zap, MapPin, Clock, Wrench, Car, Star, CheckCircle2, TrendingDown, TrendingUp, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ClaimedLeadThread from "./ClaimedLeadThread";
import ClaimedLeadsList from "./ClaimedLeadsList";
import { fireNewLeadNotification, requestNotificationPermissionSilently } from "@/lib/notifications";



const VERDICT_STYLE = {
  ripoff: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  fair: "bg-emerald-100 text-emerald-700",
  great_deal: "bg-blue-100 text-blue-700",
  market_rate: "bg-yellow-100 text-yellow-700",
  too_cheap: "bg-purple-100 text-purple-700",
};

function Countdown({ availableUntil }) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, new Date(availableUntil) - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [availableUntil]);

  const totalMins = Math.floor(remaining / 60000);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const secs = Math.floor((remaining % 60000) / 1000);
  const isUrgent = remaining < 5 * 60 * 1000;
  if (remaining === 0) return <span className="text-xs font-bold text-red-500">Expired</span>;
  return (
    <span className={`text-xs font-bold tabular-nums flex items-center gap-1 ${isUrgent ? "text-red-500 animate-pulse" : "text-amber-600"}`}>
      <Clock className="h-3 w-3" />
      {hrs > 0
        ? `${hrs}h ${String(mins).padStart(2, "0")}m`
        : `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`}
    </span>
  );
}

// Countdown showing featured-exclusive time remaining
function FeaturedWindow({ exclusiveUntil }) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, new Date(exclusiveUntil) - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [exclusiveUntil]);

  if (remaining <= 0) return null;
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return (
    <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      Featured exclusive: {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")} left
    </span>
  );
}

export default function LiveLeadsFeed({ profile: initialProfile, isVerified = true, onClaimSuccess, onGoVerify, showClaimedOnly = false }) {
  const [profile, setProfile] = useState(initialProfile);
  const [leads, setLeads] = useState([]);
  const [claiming, setClaiming] = useState(null);
  const [claimedLeads, setClaimedLeads] = useState({});
  const [now, setNow] = useState(new Date());
  const [competitorCount, setCompetitorCount] = useState(0);

  // Real count of other verified mechanics in this state who can see the same leads
  useEffect(() => {
    if (!initialProfile?.state) return;
    base44.functions.invoke("getPublicMechanics", { state: initialProfile.state })
      .then(res => {
        const list = res.data?.mechanics || res.mechanics || [];
        setCompetitorCount(Math.max(0, list.length - 1));
      })
      .catch(() => {});
  }, [initialProfile?.state]);

  // Tick every second to re-evaluate exclusive windows
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Ask for notification permission so mechanics get alerted on new leads
  useEffect(() => {
    requestNotificationPermissionSilently();
  }, []);

  // Auto-resume: if paused and the "fully booked until" date has passed, resume leads automatically
  useEffect(() => {
    if (
      profile?.accepting_bookings === false &&
      profile?.unavailable_until &&
      new Date(profile.unavailable_until) <= new Date()
    ) {
      base44.functions.invoke('updateMyMechanicProfile', { profile_id: profile.id, updates: { accepting_bookings: true } }).then(() => {
        setProfile(p => ({ ...p, accepting_bookings: true }));
        toast.success("Welcome back! Your lead delivery has automatically resumed.");
      });
    }
  }, [profile?.id]);

  const hasActiveSubscription = (profile?.subscription_tier === 'starter' || profile?.subscription_tier === 'featured');
  const isFeatured = profile?.subscription_tier === "featured" && hasActiveSubscription;

  const fetchLeads = useCallback(async () => {
    if (!profile) return;
    const all = await base44.entities.MechanicLead.filter({ state: profile.state }, "-created_date", 50);
    const mechanicType = profile.mechanic_type || 'workshop';

    const visible = all.filter(l => {
      if (l.claimed_by_profile_id === profile.id) return true;
      if (l.status !== "available" || new Date(l.available_until) <= new Date()) return false;
      if (l.featured_exclusive_until && new Date(l.featured_exclusive_until) > new Date() && !isFeatured) return false;
      if (l.target_mechanic_types && l.target_mechanic_types.length > 0) {
        if (!l.target_mechanic_types.includes(mechanicType)) return false;
      }
      // --- Mechanic preference filters ---
      // Job type — fuzzy keyword match: split both strings into words, check for overlap
      const prefJobTypes = profile.pref_job_types || [];
      if (prefJobTypes.length > 0 && l.service_type) {
        const stopWords = new Set(["a","an","the","and","or","of","with","for","in","to","by","at","on","is","the","/"]);
        const tokenise = (str) => str.toLowerCase().split(/[\s\/\(\)&,]+/).filter(w => w.length > 2 && !stopWords.has(w));
        const leadTokens = new Set(tokenise(l.service_type));
        const matched = prefJobTypes.some(pref => {
          const prefTokens = tokenise(pref);
          // Match if ANY meaningful word from the preference appears in the lead service type
          return prefTokens.some(t => leadTokens.has(t));
        });
        if (!matched) return false;
      }
      // Fuel type
      const prefFuels = profile.pref_fuel_types || [];
      if (prefFuels.length > 0 && l.fuel_type) {
        if (!prefFuels.includes(l.fuel_type)) return false;
      }
      // Car make
      const prefMakes = profile.pref_car_makes || [];
      if (prefMakes.length > 0 && l.car_make) {
        if (!prefMakes.map(m => m.toLowerCase()).includes(l.car_make.toLowerCase())) return false;
      }
      // Max odometer
      if (profile.pref_max_odometer && l.odometer && l.odometer > profile.pref_max_odometer) return false;
      return true;
    });

    setLeads(visible);
    const myClaimedMap = {};
    all.filter(l => l.claimed_by_profile_id === profile.id).forEach(l => { myClaimedMap[l.id] = true; });
    setClaimedLeads(myClaimedMap);
  }, [profile, isFeatured]);

  const playNewLeadSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Two-tone chime: high then higher
      [880, 1100].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
        gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + i * 0.18 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.45);
        osc.start(ctx.currentTime + i * 0.18);
        osc.stop(ctx.currentTime + i * 0.18 + 0.5);
      });
    } catch {}
  };

  useEffect(() => {
    fetchLeads();
    const unsub = base44.entities.MechanicLead.subscribe((event) => {
      if (event.type === "create" && event.data?.state === profile?.state) {
        // Only show instantly if featured or past exclusive window
        const exclusive = event.data.featured_exclusive_until;
        if (exclusive && new Date(exclusive) > new Date() && !isFeatured) return;
        // Filter by target mechanic type
        const mType = profile?.mechanic_type || 'workshop';
        const targets = event.data.target_mechanic_types;
        if (targets && targets.length > 0 && !targets.includes(mType)) return;
        setLeads(prev => {
          if (prev.find(l => l.id === event.data.id)) return prev;
          playNewLeadSound();
          fireNewLeadNotification({
            vehicle: `${event.data.car_year || ""} ${event.data.car_make || ""} ${event.data.car_model || ""}`.trim(),
            service: event.data.service_type,
            suburb: event.data.suburb,
            state: event.data.state,
          });
          return [event.data, ...prev];
        });
      } else if (event.type === "update") {
        setLeads(prev => prev
          .map(l => l.id === event.id ? { ...l, ...event.data } : l)
          .filter(l => {
            if (l.claimed_by_profile_id === profile?.id) return true;
            return l.status === "available" && new Date(l.available_until) > new Date();
          })
        );
      }
    });
    return unsub;
  }, [profile, fetchLeads, isFeatured]);

  // Periodic refresh as a fallback — subscription handles most updates in real-time
  useEffect(() => {
    const id = setInterval(() => {
      fetchLeads();
    }, 60000); // 60s fallback instead of 10s — subscription handles real-time
    return () => clearInterval(id);
  }, [fetchLeads]);

  const handleClaim = async (lead) => {
    setClaiming(lead.id);
    try {
      const res = await base44.functions.invoke("claimMechanicLead", {
        lead_id: lead.id,
        mechanic_profile_id: profile.id,
      });
      console.log("claimMechanicLead response:", res);
      
      const success = res.data?.success || res.success;
      if (success) {
        const data = res.data || res;
        toast.success("Lead unlocked!");
        setClaimedLeads(prev => ({ ...prev, [lead.id]: true }));
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: "claimed", claimed_by_profile_id: profile.id } : l));
        // Update free_leads_used directly from the backend response so the counter decrements immediately
        if (data.used_free && !hasActiveSubscription) {
          setProfile(prev => ({ ...prev, free_leads_used: (prev.free_leads_used || 0) + 1 }));
        }
        if (onClaimSuccess) onClaimSuccess();
      } else {
        toast.error(res.data?.error || res.error || "Could not unlock lead.");
      }
    } catch (err) {
      console.error("claimMechanicLead error:", err);
      // Extract error from Axios-style response or message
      const errMsg = err?.response?.data?.error || err?.data?.error || err?.message || "Failed to unlock lead.";
      toast.error(errMsg);
      // If the lead expired, remove it from the feed
      if (errMsg?.includes("expired")) {
        setLeads(prev => prev.filter(l => l.id !== lead.id));
      }
    } finally {
      setClaiming(null);
    }
  };

  const getFreeLeadStatus = () => {
    const used = profile.free_leads_used || 0;
    // Subscribers don't use the free counter — return 0 so it never shows
    if (hasActiveSubscription) return { freeLeft: 0 };
    return { freeLeft: Math.max(0, 10 - used) };
  };

  const availableLeads = leads.filter(l => l.status === "available" && !claimedLeads[l.id]);
  const myLeads = leads.filter(l => claimedLeads[l.id] || l.claimed_by_profile_id === profile.id);
  const { freeLeft } = getFreeLeadStatus();

  // Count leads hidden in featured window (for teaser message)
  const hiddenCount = 0; // We refetch every 10s so these just appear when window opens

  // If showClaimedOnly, render claimed leads only (no plan banner, no available leads)
  const hideLead = async (lead) => {
    await base44.entities.MechanicLead.update(lead.id, { hidden_by_mechanic: true });
    setLeads(prev => prev.filter(l => l.id !== lead.id));
    toast.success("Lead removed from your list.");
  };

  if (showClaimedOnly) {
    const visibleMyLeads = myLeads.filter(l => !l.hidden_by_mechanic);
    return (
      <ClaimedLeadsList leads={visibleMyLeads} profile={profile} onHide={hideLead} onUpdate={(updatedLead) => setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l))} />
    );
  }

  // Not verified — show real leads with money visible; only claiming is locked
  if (!isVerified) {
    const totalValue = availableLeads.reduce((sum, l) => sum + (l.quoted_price || 0), 0);
    return (
      <div className="space-y-4 pb-4">
        {/* Status bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-600">Live · {profile.state}</span>
          </div>
          <p className="text-xs text-muted-foreground">{availableLeads.length} available now</p>
        </div>

        {/* Money-on-the-table banner */}
        <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 space-y-2">
          <p className="font-heading font-bold text-amber-900 text-sm">
            {availableLeads.length > 0
              ? <>🔥 {availableLeads.length} live job{availableLeads.length !== 1 ? 's' : ''}{totalValue > 0 ? <> worth <span className="text-base">${totalValue.toLocaleString()}</span></> : ''} in {profile.state} right now</>
              : <>Leads in {profile.state} appear here in real time</>}
          </p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Get verified (takes ~5 min to upload, approved within 48h) to claim leads and get customer contact details.
          </p>
          <button
            onClick={onGoVerify}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-heading font-bold hover:bg-accent/90 transition-colors"
          >
            <Zap className="h-4 w-4" /> Verify to start claiming →
          </button>
        </div>

        {/* Real lead cards — full details, claim locked */}
        {availableLeads.map(lead => (
          <div key={lead.id} className="rounded-xl border-2 border-accent/30 bg-accent/5 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-heading font-bold text-sm">{lead.car_year} {lead.car_make} {lead.car_model}</p>
                  {lead.is_quick_job && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500 text-white">⚡ Quick Job</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Wrench className="h-3 w-3" /> {lead.service_type}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {lead.suburb ? `${lead.suburb}, ` : ""}{lead.state}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                {lead.quoted_price > 0 && (
                  <span className="text-sm font-bold text-foreground">${lead.quoted_price?.toLocaleString()}</span>
                )}
                <Countdown availableUntil={lead.available_until} />
              </div>
            </div>
            {(lead.app_fair_price_low || lead.app_fair_price_high) && (
              <p className="text-[11px] text-muted-foreground">
                Fair range: <strong className="text-foreground">${lead.app_fair_price_low?.toLocaleString()} – ${lead.app_fair_price_high?.toLocaleString()}</strong>
              </p>
            )}
            {/* Blurred contact teaser */}
            <div className="rounded-lg bg-white/70 border border-slate-200 px-3 py-2 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500 blur-[4px] select-none">0412 345 678 · customer@email.com</span>
              <span className="text-[10px] font-bold text-slate-500 flex-shrink-0">🔒 Contact hidden</span>
            </div>
            <Button
              onClick={onGoVerify}
              className="w-full h-10 font-heading font-bold text-sm gap-2 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <CheckCircle2 className="h-4 w-4" /> Verify to claim this lead
            </Button>
          </div>
        ))}

        {availableLeads.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No live leads right now in <strong>{profile.state}</strong></p>
            <p className="text-xs mt-1">Get verified now so you're ready when the next one drops.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-600">Live · {profile.state}</span>
        </div>
        <p className="text-xs text-muted-foreground">{availableLeads.length} available now</p>
      </div>

      {/* Availability status banner */}
      {profile?.accepting_bookings === false && (
        <div className="rounded-xl bg-slate-100 border border-slate-300 px-4 py-3 text-xs text-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">⏸️</span>
            <div>
              <strong>Booked out — leads paused</strong>
              <span className="block text-slate-500 mt-0.5">
                {profile?.unavailable_until && new Date(profile.unavailable_until) > new Date()
                  ? `Leads will automatically resume on ${new Date(profile.unavailable_until).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}.`
                  : "New leads won't be shown until you resume."}
              </span>
            </div>
          </div>
          <button
            onClick={async () => {
              await base44.functions.invoke('updateMyMechanicProfile', { profile_id: profile.id, updates: { accepting_bookings: true } });
              window.location.reload();
            }}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
          >
            Resume
          </button>
        </div>
      )}

      {/* Plan / credit status */}
      {isFeatured ? (
        <div className="rounded-xl bg-amber-50 border border-amber-300 px-4 py-3 text-xs text-amber-800 flex items-start gap-2">
          <Star className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 fill-amber-400 text-amber-400" />
          <div>
            <strong>Featured plan</strong> — you see every new lead <strong>3 minutes before</strong> other mechanics.
            <span> Unlock <strong>unlimited leads</strong> included in your subscription.</span>
          </div>
        </div>
      ) : hasActiveSubscription && profile.subscription_tier === "starter" ? (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-800 flex items-start gap-2">
          <Zap className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Starter plan</strong> — unlock <strong>unlimited leads</strong> included in your subscription.
            <span className="block mt-0.5 text-blue-700">Leads open to you 3 minutes after they're created. <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("open-mechanic-settings", { detail: { tab: "billing" } }))} className="underline font-semibold">Upgrade to Featured</button> to see them instantly.</span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 flex items-start gap-2">
          <Zap className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <div>
            {freeLeft > 0 ? (
              <span><strong>{freeLeft} free lead unlock{freeLeft !== 1 ? 's' : ''}</strong> remaining. After that, a subscription is required to unlock leads.</span>
            ) : (
              <span>Your free unlocks are used up. <strong>Subscribe to a plan</strong> to keep unlocking leads.</span>
            )}
            <span className="block mt-0.5 text-amber-700">New leads are visible after a 3-min featured window. <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("open-mechanic-settings", { detail: { tab: "billing" } }))} className="underline font-semibold">Upgrade for unlimited unlocks.</button></span>
          </div>
        </div>
      )}

      {/* Available leads — hidden when paused */}
      {profile?.accepting_bookings === false ? null : <AnimatePresence>
        {availableLeads.map(lead => {
          const inExclusiveWindow = lead.featured_exclusive_until && new Date(lead.featured_exclusive_until) > now;
          const canClaim = hasActiveSubscription || freeLeft > 0;
          const isHotQuickJob = lead.is_quick_job;
          return (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className={`relative rounded-xl border-2 p-4 space-y-3 ${
                isHotQuickJob
                  ? "border-emerald-400 bg-emerald-50/40"
                  : inExclusiveWindow && isFeatured
                  ? "border-amber-400 bg-amber-50/60"
                  : "border-accent/30 bg-accent/5"
              }`}
            >
              <button
                onClick={() => setLeads(prev => prev.filter(l => l.id !== lead.id))}
                className="absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors z-10"
                title="Dismiss lead"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-heading font-bold text-sm">{lead.car_year} {lead.car_make} {lead.car_model}</p>
                    {lead.verdict && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${VERDICT_STYLE[lead.verdict] || "bg-secondary text-muted-foreground"}`}>
                        {lead.verdict.replace("_", " ")}
                      </span>
                    )}
                    {lead.is_quick_job && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500 text-white flex items-center gap-1 shadow-sm">
                        ⚡ Quick Job
                      </span>
                    )}
                    {lead.is_major_service && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-white flex items-center gap-1">
                        🔧 Workshop Job
                      </span>
                    )}
                    {inExclusiveWindow && isFeatured && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-200 text-amber-800 flex items-center gap-1">
                        <Star className="h-2.5 w-2.5 fill-amber-600" /> Exclusive
                      </span>
                    )}
                  </div>
                  {/* Vehicle details */}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 mb-1">
                    {lead.description && (
                      <span className="text-[11px] text-muted-foreground font-medium">{lead.description}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Wrench className="h-3 w-3" /> {lead.service_type}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {lead.suburb ? `${lead.suburb}, ` : ""}{lead.state}</p>
                  {competitorCount > 0 && (
                    <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1 mt-1">
                      <Eye className="h-3 w-3" /> {competitorCount} other mechanic{competitorCount !== 1 ? "s" : ""} in {lead.state} can see this lead
                    </p>
                  )}
                  {inExclusiveWindow && isFeatured && (
                    <div className="mt-1"><FeaturedWindow exclusiveUntil={lead.featured_exclusive_until} /></div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {lead.quoted_price > 0 && (
                    <span className="text-sm font-bold text-foreground">${lead.quoted_price?.toLocaleString()}</span>
                  )}
                  {lead.is_quick_job ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      Ready Now
                    </span>
                  ) : (
                    <Countdown availableUntil={lead.available_until} />
                  )}
                </div>
              </div>
              {/* Vehicle specs row */}
              <div className="flex flex-wrap gap-2">
                {lead.odometer && (
                  <span className="text-[11px] bg-white/80 border border-slate-200 rounded-full px-2 py-0.5 text-slate-600 flex items-center gap-1">
                    <Car className="h-3 w-3" /> {lead.odometer?.toLocaleString()} km
                  </span>
                )}
                {lead.car_variant && (
                  <span className="text-[11px] bg-white/80 border border-slate-200 rounded-full px-2 py-0.5 text-slate-600">{lead.car_variant}</span>
                )}
                {lead.fuel_type && (
                  <span className={`text-[11px] rounded-full px-2 py-0.5 font-semibold ${lead.fuel_type === "Electric" ? "bg-green-100 text-green-700 border border-green-200" : lead.fuel_type === "Hybrid" || lead.fuel_type === "PHEV" ? "bg-teal-100 text-teal-700 border border-teal-200" : "bg-white/80 border border-slate-200 text-slate-600"}`}>
                    {lead.fuel_type === "Electric" ? "⚡ EV" : lead.fuel_type === "Hybrid" ? "🔋 Hybrid" : lead.fuel_type === "PHEV" ? "🔌 PHEV" : lead.fuel_type}
                  </span>
                )}
                {lead.transmission_type && (
                  <span className="text-[11px] bg-white/80 border border-slate-200 rounded-full px-2 py-0.5 text-slate-600">{lead.transmission_type}</span>
                )}
              </div>

              {/* ServCheck Fair Price Range */}
              {(lead.app_fair_price_low || lead.app_fair_price_high || lead.app_fair_price_average) && (
                <div className="rounded-xl bg-[#1a237e]/5 border border-[#1a237e]/20 px-3 py-2.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#1a237e] mb-1.5">ServCheck Fair Range</p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <TrendingDown className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-700">${lead.app_fair_price_low?.toLocaleString()}</span>
                    </div>
                    <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden border border-slate-200">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" style={{ width: "80%", marginLeft: "10%" }} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-600">${lead.app_fair_price_high?.toLocaleString()}</span>
                      <TrendingUp className="h-3 w-3 text-slate-500" />
                    </div>
                  </div>
                  {lead.app_fair_price_average && (
                    <p className="text-[10px] text-center text-slate-500 mt-1">Avg: <strong className="text-[#1a237e]">${lead.app_fair_price_average?.toLocaleString()}</strong></p>
                  )}
                </div>
              )}

              <Button
                onClick={() => canClaim ? handleClaim(lead) : window.dispatchEvent(new CustomEvent("open-mechanic-settings", { detail: { tab: "billing" } }))}
                disabled={claiming === lead.id}
                className={`w-full h-10 font-heading font-bold text-sm gap-2 ${
                  isHotQuickJob && canClaim
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : inExclusiveWindow && isFeatured
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-accent text-white hover:bg-accent/90"
                }`}
              >
                {claiming === lead.id ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Unlocking...</span>
                ) : hasActiveSubscription ? (
                  <><Zap className="h-4 w-4" /> {isHotQuickJob ? "Grab Quick Job" : "Unlock Lead"}</>
                ) : isHotQuickJob && freeLeft > 0 ? (
                  <><Zap className="h-4 w-4" /> Grab Quick Job — Free ({freeLeft} left)</>
                ) : freeLeft > 0 ? (
                  <><Zap className="h-4 w-4" /> Unlock — Free ({freeLeft} left)</>
                ) : (
                  <><Zap className="h-4 w-4" /> Subscribe to Unlock</>
                )}
              </Button>
            </motion.div>
          );
        })}
      </AnimatePresence>}

      {profile?.accepting_bookings !== false && availableLeads.length === 0 && (
        <div className="text-center py-14 text-muted-foreground">
          <Zap className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-semibold">No live leads right now</p>
          <p className="text-xs mt-1">When a user in <strong>{profile.state}</strong> checks a quote, it appears here instantly.</p>
        </div>
      )}
    </div>
  );
}