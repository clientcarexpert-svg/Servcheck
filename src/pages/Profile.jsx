import { useState, useEffect } from "react";
import SEOHead from "../components/SEOHead";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getCredits, deductCredit, CREDITS_PER_CHECK } from "@/lib/credits";
import SubscriptionModal from "@/components/SubscriptionModal";
import AIServicePrediction from "@/components/AIServicePrediction";
import ReceiptScanner from "@/components/ReceiptScanner";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { BookOpen, Plus, Wrench, Bell, ChevronDown, ChevronUp, Trash2, X, Car, User, MessageCircle, CheckCircle2, Clock, XCircle, DollarSign, Send, ChevronRight, CreditCard, Sparkles } from "lucide-react";
import UploadToEarnModal from "../components/UploadToEarnModal";
import EquityMeter from "../components/EquityMeter";
import CarSetupModal from "../components/CarSetupModal";
import PremiumGate from "../components/PremiumGate";

const STATES = ["NSW","VIC","QLD","WA","SA","TAS","ACT","NT"];

const COMMON_PARTS = [
  "Engine Oil & Filter","Air Filter","Cabin Air Filter","Spark Plugs",
  "Brake Pads (Front)","Brake Pads (Rear)","Brake Rotors","Brake Fluid",
  "Transmission Fluid","Coolant","Power Steering Fluid","Fuel Filter",
  "Timing Belt","Timing Chain","Serpentine Belt","Battery",
  "Tyres (Set of 4)","Wiper Blades","CV Joints","Shock Absorbers",
];

const DEFAULT_ENTRY = {
  car_make:"",car_model:"",car_year:"",rego:"",odometer:"",
  service_date:"",service_type:"",mechanic_name:"",cost:"",
  notes:"",next_service_km:"",next_service_months:"",state:"",
  parts_replaced:[],
};

const DEFAULT_CAR = { profile_name:"", car_make:"", car_model:"", car_year:"", rego:"", color:"" };

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState("cars");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || "",
    username: user?.username || "",
    suburb: user?.suburb || "",
    state: user?.state || "",
  });
  const [usernameError, setUsernameError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Quote requests
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [qrLoading, setQrLoading] = useState(true);
  const [expandedQR, setExpandedQR] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [sendingReply, setSendingReply] = useState(null);

  // Car profiles
  const [cars, setCars] = useState([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [showCarSetup, setShowCarSetup] = useState(false);

  // Logbook
  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_ENTRY);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [newPart, setNewPart] = useState({ part:"",brand:"",next_due_km:"",next_due_months:"" });
  const [aiNextServiceLoading, setAiNextServiceLoading] = useState(false);
  const [showUploadEarn, setShowUploadEarn] = useState(false);

  const handleAINextService = async () => {
    const isPremium = user?.is_premium && (!user?.premium_expires_at || new Date(user.premium_expires_at) > new Date());
    if (!isPremium) { setShowPaywall(true); return; }
    setAiNextServiceLoading(true);
    const parts = form.parts_replaced.map(p => p.part).join(", ");
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an Australian automotive expert. Based on the following service details, predict the next recommended service interval.

Car: ${form.car_year} ${form.car_make} ${form.car_model}
Service performed: ${form.service_type}
Current odometer: ${form.odometer} km
Parts replaced: ${parts || "none specified"}
Notes: ${form.notes || "none"}

Return ONLY a JSON with:
- next_service_km: the odometer reading at which the next service is due (integer)
- next_service_months: months until next service is due (integer)

Base your answer on Australian standards and the specific service type performed.`,
      response_json_schema: {
        type: "object",
        properties: {
          next_service_km: { type: "number" },
          next_service_months: { type: "number" },
        },
      },
    });
    if (result?.next_service_km) update("next_service_km", String(Math.round(result.next_service_km)));
    if (result?.next_service_months) update("next_service_months", String(Math.round(result.next_service_months)));
    setAiNextServiceLoading(false);
    toast.success("Next service predicted by AI!");
  };

  useEffect(() => {
    base44.entities.CarProfile.list("-created_date", 20).then(setCars).finally(() => setCarsLoading(false));
    base44.entities.LogbookEntry.list("-service_date", 50).then(setEntries).finally(() => setEntriesLoading(false));
    base44.entities.QuoteRequest.list("-created_date", 50).then(setQuoteRequests).finally(() => setQrLoading(false));
  }, []);

  const handleDeleteCar = async (id) => {
    await base44.entities.CarProfile.delete(id);
    setCars(p => p.filter(c => c.id !== id));
    toast.success("Car profile removed.");
  };

  // Logbook helpers
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const handleReceiptExtracted = (data) => {
    setForm(p => ({
      ...p,
      mechanic_name: data.mechanic_name || p.mechanic_name,
      service_date: data.service_date || p.service_date,
      odometer: data.odometer ? String(data.odometer) : p.odometer,
      cost: data.cost ? String(data.cost) : p.cost,
      service_type: data.service_type || p.service_type,
      notes: data.notes || p.notes,
      parts_replaced: data.parts?.length ? [...p.parts_replaced, ...data.parts] : p.parts_replaced,
    }));
    toast.success("Receipt scanned — form auto-filled!");
  };
  const addPart = () => {
    if (!newPart.part) return;
    setForm(p => ({ ...p, parts_replaced: [...p.parts_replaced, {
      ...newPart,
      next_due_km: newPart.next_due_km ? parseInt(newPart.next_due_km) : undefined,
      next_due_months: newPart.next_due_months ? parseInt(newPart.next_due_months) : undefined,
    }]}));
    setNewPart({ part:"",brand:"",next_due_km:"",next_due_months:"" });
  };
  const removePart = (i) => setForm(p => ({ ...p, parts_replaced: p.parts_replaced.filter((_,idx) => idx !== i) }));
  const handleSave = async (e) => {
    e.preventDefault();
    if (getCredits() < 5) { setShowPaywall(true); return; }
    const deducted = await deductCredit();
    if (!deducted) { setShowPaywall(true); return; }
    setSaving(true);
    const entry = await base44.entities.LogbookEntry.create({
      ...form,
      odometer: form.odometer ? parseInt(form.odometer) : undefined,
      cost: form.cost ? parseFloat(form.cost) : undefined,
      next_service_km: form.next_service_km ? parseInt(form.next_service_km) : undefined,
      next_service_months: form.next_service_months ? parseInt(form.next_service_months) : undefined,
    });
    setEntries(p => [entry, ...p]);
    setForm(DEFAULT_ENTRY);
    setShowForm(false);
    setSaving(false);
    toast.success("Entry saved to logbook.");
  };
  const handleDelete = async (id) => {
    await base44.entities.LogbookEntry.delete(id);
    setEntries(p => p.filter(e => e.id !== id));
    toast.success("Entry deleted.");
  };

  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }
    try {
      const res = await base44.functions.invoke('checkUsernameAvailability', { username });
      if (!res.data.available) {
        setUsernameError(res.data.message || 'Username already taken');
        return false;
      }
      setUsernameError('');
      return true;
    } catch (err) {
      setUsernameError('Error checking username');
      return false;
    }
  };

  const handleSaveProfile = async () => {
    if (!profileForm.username) {
      setUsernameError('Username is required');
      return;
    }
    const available = await checkUsernameAvailability(profileForm.username);
    if (!available) return;

    setSavingProfile(true);
    try {
      await base44.auth.updateMe({
        full_name: profileForm.full_name,
        username: profileForm.username.toLowerCase().trim(),
        suburb: profileForm.suburb,
        state: profileForm.state,
      });
      await refreshUser();
      setEditingProfile(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const reminders = entries.flatMap(entry =>
    (entry.parts_replaced || [])
      .filter(p => p.next_due_km || p.next_due_months)
      .map(p => ({
        car: `${entry.car_year} ${entry.car_make} ${entry.car_model}`,
        part: p.part, next_due_km: p.next_due_km, next_due_months: p.next_due_months,
        current_km: entry.odometer, service_date: entry.service_date,
      }))
  );
  const getReminderStatus = (r) => {
    const kmLeft = r.next_due_km && r.current_km ? r.next_due_km - r.current_km : null;
    let monthsLeft = null;
    if (r.service_date && r.next_due_months) {
      const dueDate = new Date(new Date(r.service_date).getTime() + r.next_due_months * 30 * 24 * 60 * 60 * 1000);
      monthsLeft = Math.round((dueDate - new Date()) / (30 * 24 * 60 * 60 * 1000));
    }
    const urgent = (kmLeft !== null && kmLeft < 5000) || (monthsLeft !== null && monthsLeft <= 1);
    const warning = (kmLeft !== null && kmLeft < 10000) || (monthsLeft !== null && monthsLeft <= 3);
    return { urgent, warning, kmLeft, monthsLeft };
  };

  return (
    <div>
      <SEOHead title="My Profile" description="Your ServCheck profile." path="/profile" noindex={true} />
      {showUploadEarn && (
        <UploadToEarnModal onClose={() => setShowUploadEarn(false)} onSuccess={() => setShowUploadEarn(false)} />
      )}
      {showPaywall && (
        <SubscriptionModal
          onClose={() => setShowPaywall(false)}
          onSuccess={(c) => { setShowPaywall(false); toast.success(`${c} credits added!`); }}
          defaultTab="premium"
        />
      )}

      {/* Header — full bleed with wave bottom */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-10">
        <div className="bg-gradient-to-br from-[#1a237e] via-[#1e3a8a] to-[#1565c0] pt-6 pb-16 px-5 text-white relative overflow-hidden">
          {/* Honeycomb pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="honeycomb" x="0" y="0" width="56" height="50" patternUnits="userSpaceOnUse">
                <polygon points="14,2 42,2 56,25 42,48 14,48 0,25" fill="none" stroke="white" strokeWidth="1.5"/>
                <polygon points="42,27 70,27 84,50 70,73 42,73 28,50" fill="none" stroke="white" strokeWidth="1.5"/>
                <polygon points="-14,27 14,27 28,50 14,73 -14,73 -28,50" fill="none" stroke="white" strokeWidth="1.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#honeycomb)"/>
          </svg>
          {/* Decorative blobs */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute top-4 right-10 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative flex items-center gap-4 max-w-2xl mx-auto">
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Car className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              {cars.length > 0 ? (
                <>
                  <h1 className="font-heading font-black text-2xl text-white leading-tight">{cars[0].car_year} {cars[0].car_make} {cars[0].car_model}</h1>
                  <p className="text-blue-200 text-sm mt-0.5">{cars[0].profile_name || cars[0].rego || "Primary vehicle"}</p>
                </>
              ) : (
                <>
                  <h1 className="font-heading font-black text-2xl text-white leading-tight">My Cars</h1>
                  <p className="text-blue-200 text-sm mt-0.5">Add a car to get started</p>
                </>
              )}
            </div>
            {tab !== "cars" && (
              <Button onClick={() => setTab("cars")} variant="default" size="sm" className="flex-shrink-0 bg-white/20 hover:bg-white/30 text-white border-0">
                View All
              </Button>
            )}
          </div>
        </div>
        {/* Wave SVG */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
          <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="w-full h-12 block" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,32 C360,64 1080,0 1440,32 L1440,48 L0,48 Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </motion.div>

      <div className="max-w-2xl mx-auto px-4 pb-10">

      {/* Tabs */}
      <div className="flex gap-0 rounded-xl bg-slate-100 p-1 mb-8">
        <button
          onClick={() => setTab("cars")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === "cars"
              ? "bg-white text-[#1a237e] shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Car className="h-4 w-4" /> My Cars
        </button>
        <button
          onClick={() => setTab("logbook")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === "logbook"
              ? "bg-white text-[#1a237e] shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <BookOpen className="h-4 w-4" /> Logbook
        </button>
        <button
          onClick={() => setTab("quotes")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all relative ${
            tab === "quotes"
              ? "bg-white text-[#1a237e] shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <MessageCircle className="h-4 w-4" /> Quotes
          {quoteRequests.filter(q => q.status === "responded").length > 0 && (
            <span className="h-4 w-4 rounded-full bg-[#f97316] text-white text-[10px] font-bold flex items-center justify-center">
              {quoteRequests.filter(q => q.status === "responded").length}
            </span>
          )}
        </button>

      </div>

      {/* MY CARS TAB */}
      {tab === "cars" && (
        <div>
          {showCarSetup && (
            <CarSetupModal
              onClose={() => setShowCarSetup(false)}
              onSaved={(car) => { setCars(p => [car, ...p]); setShowCarSetup(false); }}
            />
          )}

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-muted-foreground">My Cars & Equity Meter</p>
            <Button onClick={() => setShowCarSetup(true)} size="sm" className="gap-1.5 h-9">
              <Plus className="h-3.5 w-3.5" /> Add Car
            </Button>
          </div>

          {carsLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Loading…</div>
          ) : cars.length === 0 ? (
            <div className="text-center py-16">
              <Car className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-semibold text-muted-foreground">No cars saved yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Add your car to track its live market value.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {cars.map((car, i) => (
                <motion.div key={car.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <PremiumGate user={user}>
                    <EquityMeter
                      profile={car}
                      onUpdated={(updated) => setCars(p => p.map(c => c.id === updated.id ? updated : c))}
                    />
                  </PremiumGate>
                  <div className="flex justify-end mt-2">
                    <button onClick={() => handleDeleteCar(car.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3 w-3" /> Remove car
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LOGBOOK TAB */}
      {tab === "logbook" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-muted-foreground">Digital Logbook</p>
            <Button
              onClick={() => {
                if (!getCredits()) { setShowPaywall(true); return; }
                if (!showForm && cars.length > 0) {
                  const car = cars[0];
                  setForm({
                    ...DEFAULT_ENTRY,
                    car_make: car.car_make || "",
                    car_model: car.car_model || "",
                    car_year: car.car_year || "",
                    rego: car.rego || "",
                    state: car.state || "",
                    odometer: car.last_odometer ? String(car.last_odometer) : "",
                  });
                }
                setShowForm(!showForm);
              }}
              variant={showForm ? "outline" : "default"}
              size="sm"
              className="gap-1.5 h-9"
            >
              {showForm ? <><X className="h-3.5 w-3.5" /> Cancel</> : <><Plus className="h-3.5 w-3.5" /> Add Entry</>}
            </Button>
          </div>

          {/* Upload to Earn promo */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowUploadEarn(true)}
            className="w-full mb-5 rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-white p-4 flex items-center gap-4 text-left hover:border-emerald-500 hover:shadow-md transition-all group"
          >
            <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow">
              <span className="text-xl">🧾</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-sm text-emerald-900">Earn 2 Free Credits</p>
              <p className="text-xs text-emerald-700 mt-0.5 leading-snug">Upload a past service receipt to build your logbook & earn 2 free credits — up to twice per month.</p>
            </div>
            <ChevronRight className="h-5 w-5 text-emerald-500 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </motion.button>

          {entries.length > 0 && <div className="mb-5"><AIServicePrediction entries={entries} /></div>}

          {reminders.length > 0 && (
            <div className="mb-5 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Service Reminders</span>
              </div>
              <div className="p-3 space-y-2">
                {reminders.map((r, i) => {
                  const s = getReminderStatus(r);
                  return (
                    <div key={i} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm ${s.urgent ? "bg-red-50 border-red-200" : s.warning ? "bg-amber-50 border-amber-200" : "bg-secondary/40 border-transparent"}`}>
                      <div>
                        <p className="font-medium text-sm">{r.part}</p>
                        <p className="text-xs text-muted-foreground">{r.car}</p>
                      </div>
                      <div className="text-right text-xs">
                        {r.next_due_km && <p className="font-medium">Due: {r.next_due_km?.toLocaleString()} km</p>}
                        {s.kmLeft !== null && <p className={s.urgent ? "text-red-600 font-semibold" : "text-muted-foreground"}>{s.kmLeft?.toLocaleString()} km left</p>}
                        {s.monthsLeft !== null && <p className={s.urgent ? "text-red-600 font-semibold" : "text-muted-foreground"}>{s.monthsLeft}mo left</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {showForm && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <p className="font-semibold text-sm">New Service Entry</p>
                <p className="text-xs text-muted-foreground mt-0.5">1 credit will be deducted on save</p>
              </div>
              <div className="p-5">
                <div className="mb-4"><ReceiptScanner onExtracted={handleReceiptExtracted} /></div>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Make</Label>
                      <Input placeholder="Toyota" value={form.car_make} onChange={e => update("car_make", e.target.value)} className="h-10 bg-secondary/50 border-0" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Model</Label>
                      <Input placeholder="Corolla" value={form.car_model} onChange={e => update("car_model", e.target.value)} className="h-10 bg-secondary/50 border-0" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Year</Label>
                      <Input placeholder="2020" value={form.car_year} onChange={e => update("car_year", e.target.value)} className="h-10 bg-secondary/50 border-0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Odometer (km)</Label>
                      <Input type="number" placeholder="85000" value={form.odometer} onChange={e => update("odometer", e.target.value)} className="h-10 bg-secondary/50 border-0" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Service Date</Label>
                      <Input type="date" value={form.service_date} onChange={e => update("service_date", e.target.value)} className="h-10 bg-secondary/50 border-0" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Service Type</Label>
                    <Input placeholder="e.g. Full Service, Brake Replacement" value={form.service_type} onChange={e => update("service_type", e.target.value)} className="h-10 bg-secondary/50 border-0" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Mechanic / Shop</Label>
                      <Input placeholder="Bob's Auto" value={form.mechanic_name} onChange={e => update("mechanic_name", e.target.value)} className="h-10 bg-secondary/50 border-0" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Cost (AUD)</Label>
                      <Input type="number" placeholder="350" value={form.cost} onChange={e => update("cost", e.target.value)} className="h-10 bg-secondary/50 border-0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">State</Label>
                      <Select value={form.state} onValueChange={v => update("state", v)}>
                        <SelectTrigger className="h-10 bg-secondary/50 border-0"><SelectValue placeholder="State" /></SelectTrigger>
                        <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Rego / Plate</Label>
                      <Input placeholder="ABC123" value={form.rego} onChange={e => update("rego", e.target.value)} className="h-10 bg-secondary/50 border-0" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Notes</Label>
                    <Input placeholder="Any extra notes…" value={form.notes} onChange={e => update("notes", e.target.value)} className="h-10 bg-secondary/50 border-0" />
                  </div>

                  {/* Parts Replaced — BEFORE next service */}
                  <div className="rounded-lg border border-border p-3 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Parts Replaced</p>
                    {form.parts_replaced.map((p, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 bg-secondary/50 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{p.part}</p>
                          <p className="text-xs text-muted-foreground">{p.brand && `${p.brand} · `}{p.next_due_km && `Next: ${parseInt(p.next_due_km).toLocaleString()} km`}{p.next_due_months && ` / ${p.next_due_months}mo`}</p>
                        </div>
                        <button type="button" onClick={() => removePart(i)}><X className="h-4 w-4 text-muted-foreground" /></button>
                      </div>
                    ))}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={newPart.part} onValueChange={v => setNewPart(p => ({ ...p, part: v }))}>
                          <SelectTrigger className="h-9 bg-secondary/50 border-0 text-sm"><SelectValue placeholder="Select part" /></SelectTrigger>
                          <SelectContent>{COMMON_PARTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                        </Select>
                        <Input placeholder="Brand (optional)" value={newPart.brand} onChange={e => setNewPart(p => ({ ...p, brand: e.target.value }))} className="h-9 bg-secondary/50 border-0 text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="number" placeholder="Next due (km)" value={newPart.next_due_km} onChange={e => setNewPart(p => ({ ...p, next_due_km: e.target.value }))} className="h-9 bg-secondary/50 border-0 text-sm" />
                        <Input type="number" placeholder="Next due (months)" value={newPart.next_due_months} onChange={e => setNewPart(p => ({ ...p, next_due_months: e.target.value }))} className="h-9 bg-secondary/50 border-0 text-sm" />
                      </div>
                      <button type="button" onClick={addPart} disabled={!newPart.part} className="w-full h-8 rounded-lg border border-dashed border-border text-muted-foreground text-xs font-medium hover:border-accent hover:text-accent transition-colors disabled:opacity-40">
                        + Add Part
                      </button>
                    </div>
                  </div>

                  {/* Next Service — at the bottom with AI auto-fill */}
                  <div className="rounded-lg border border-border bg-secondary/20 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Next Service</p>
                      <button
                        type="button"
                        onClick={handleAINextService}
                        disabled={!form.car_make || !form.service_type || aiNextServiceLoading}
                        className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition-colors disabled:opacity-40"
                      >
                        {aiNextServiceLoading ? (
                          <><div className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /> Predicting…</>
                        ) : (
                          <>✨ Auto-fill with AI</>
                        )}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Next service at (km)</Label>
                        <Input type="number" placeholder="95000" value={form.next_service_km} onChange={e => update("next_service_km", e.target.value)} className="h-10 bg-background border-0" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Next service in (months)</Label>
                        <Input type="number" placeholder="12" value={form.next_service_months} onChange={e => update("next_service_months", e.target.value)} className="h-10 bg-background border-0" />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={!form.car_make || !form.odometer || !form.service_date || !form.service_type || saving} className="w-full h-11 font-heading font-semibold">
                    {saving ? "Saving…" : "Save Entry"}
                  </Button>
                </form>
              </div>
            </motion.div>
          )}

          {entriesLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground text-sm">Loading…</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-semibold text-muted-foreground">No entries yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Add your first service to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-3">History ({entries.length})</p>
              {entries.map((entry, i) => (
                <motion.div key={entry.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="rounded-xl border border-border bg-card overflow-hidden">
                  <button onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)} className="w-full flex items-center justify-between px-4 py-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{entry.car_year} {entry.car_make} {entry.car_model}</p>
                        <p className="text-xs text-muted-foreground">{entry.service_type} · {entry.service_date} · {entry.odometer?.toLocaleString()} km</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {entry.cost && <span className="text-sm font-heading font-bold">${entry.cost?.toLocaleString()}</span>}
                      {expandedId === entry.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {expandedId === entry.id && (
                    <div className="px-4 pb-4 border-t border-border pt-3 space-y-2">
                      {entry.mechanic_name && <p className="text-sm"><span className="text-muted-foreground">Mechanic: </span>{entry.mechanic_name}</p>}
                      {entry.notes && <p className="text-sm"><span className="text-muted-foreground">Notes: </span>{entry.notes}</p>}
                      {(entry.next_service_km || entry.next_service_months) && (
                        <p className="text-sm text-accent font-medium">
                          Next service: {entry.next_service_km && `${entry.next_service_km?.toLocaleString()} km`}{entry.next_service_km && entry.next_service_months && " or "}{entry.next_service_months && `${entry.next_service_months} months`}
                        </p>
                      )}
                      {entry.parts_replaced?.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Parts</p>
                          {entry.parts_replaced.map((p, i) => (
                            <div key={i} className="flex justify-between text-sm bg-secondary/50 rounded-lg px-3 py-2">
                              <span>{p.part}{p.brand ? ` (${p.brand})` : ""}</span>
                              {p.next_due_km && <span className="text-xs text-muted-foreground">Due: {parseInt(p.next_due_km).toLocaleString()} km</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      <button onClick={() => handleDelete(entry.id)} className="flex items-center gap-1.5 text-xs text-destructive hover:underline pt-1">
                        <Trash2 className="h-3.5 w-3.5" /> Delete entry
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MY QUOTES TAB */}
      {tab === "quotes" && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-4">Quote requests you've sent to mechanics</p>
          {qrLoading ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-4 border-muted border-t-accent rounded-full animate-spin" /></div>
          ) : quoteRequests.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-semibold text-muted-foreground">No quote requests yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">When you ask a mechanic for a better price, it shows up here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quoteRequests.map((qr, i) => {
                const isExpanded = expandedQR === qr.id;
                const statusConfig = {
                  pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", label: "Awaiting response" },
                  responded: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", label: "Mechanic responded" },
                  declined: { icon: XCircle, color: "text-red-500", bg: "bg-red-50 border-red-200", label: "Declined" },
                }[qr.status] || { icon: Clock, color: "text-muted-foreground", bg: "bg-secondary border-border", label: qr.status };
                const StatusIcon = statusConfig.icon;

                const handleSendReply = async (qrId) => {
                  const text = replyText[qrId];
                  if (!text?.trim()) return;
                  setSendingReply(qrId);
                  await base44.entities.QuoteRequest.update(qrId, { user_reply: text.trim() });
                  setQuoteRequests(prev => prev.map(r => r.id === qrId ? { ...r, user_reply: text.trim() } : r));
                  setReplyText(prev => ({ ...prev, [qrId]: "" }));
                  setSendingReply(null);
                  toast.success("Reply sent!");
                };

                return (
                  <motion.div key={qr.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-xl border border-border bg-card overflow-hidden">
                    <button
                      onClick={() => setExpandedQR(isExpanded ? null : qr.id)}
                      className="w-full flex items-center justify-between px-4 py-4 text-left gap-3 active:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${statusConfig.bg}`}>
                          <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{qr.mechanic_business_name || "Mechanic"}</p>
                          <p className="text-xs text-muted-foreground truncate">{qr.service_type} · {qr.car_year} {qr.car_make} {qr.car_model}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-semibold hidden sm:block ${statusConfig.color}`}>{statusConfig.label}</span>
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                        {/* Your original message */}
                        <div className="rounded-lg bg-secondary/50 p-3">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Your request</p>
                          <p className="text-sm">{qr.notes || `Requested a quote for ${qr.service_type} on ${qr.car_year} ${qr.car_make} ${qr.car_model}.`}</p>
                          {qr.original_quoted_price && (
                            <p className="text-xs text-muted-foreground mt-1">Original quote: <span className="font-semibold">${qr.original_quoted_price?.toLocaleString()}</span></p>
                          )}
                        </div>

                        {/* Mechanic response */}
                        {qr.status === "responded" && (
                          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 space-y-2">
                            <p className="text-xs text-emerald-700 font-semibold">Mechanic's response</p>
                            {qr.mechanic_quote && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-emerald-600" />
                                <span className="font-heading font-bold text-emerald-700 text-lg">${qr.mechanic_quote?.toLocaleString()}</span>
                                {qr.original_quoted_price && qr.mechanic_quote < qr.original_quoted_price && (
                                  <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                                    Save ${(qr.original_quoted_price - qr.mechanic_quote).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            )}
                            {qr.mechanic_response && <p className="text-sm text-emerald-800">{qr.mechanic_response}</p>}
                          </div>
                        )}

                        {qr.status === "declined" && (
                          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                            <p className="text-xs text-red-600 font-semibold">This mechanic declined your request.</p>
                            {qr.mechanic_response && <p className="text-sm text-red-700 mt-1">{qr.mechanic_response}</p>}
                          </div>
                        )}

                        {qr.status === "pending" && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            Waiting for {qr.mechanic_business_name} to respond…
                          </div>
                        )}

                        {/* User reply — shown if responded */}
                        {qr.status === "responded" && (
                          <div className="pt-1">
                            {qr.user_reply ? (
                              <div className="rounded-lg bg-secondary/60 p-3">
                                <p className="text-xs text-muted-foreground font-medium mb-1">Your reply</p>
                                <p className="text-sm">{qr.user_reply}</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground font-medium">Reply to mechanic</p>
                                <textarea
                                  value={replyText[qr.id] || ""}
                                  onChange={e => setReplyText(prev => ({ ...prev, [qr.id]: e.target.value }))}
                                  placeholder="e.g. Sounds great, when can you book me in?"
                                  rows={2}
                                  className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                                <Button
                                  onClick={() => handleSendReply(qr.id)}
                                  disabled={!replyText[qr.id]?.trim() || sendingReply === qr.id}
                                  className="w-full h-10 bg-accent text-white hover:bg-accent/90 gap-2"
                                >
                                  {sendingReply === qr.id ? (
                                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending…</>
                                  ) : (
                                    <><Send className="h-4 w-4" /> Send Reply</>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}