import { useState, useEffect } from "react";
import SEOHead from "../components/SEOHead";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AIServicePrediction from "@/components/AIServicePrediction";
import ReceiptScanner from "@/components/ReceiptScanner";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Wrench, Bell, ChevronDown, ChevronUp, Trash2, X, ChevronRight, Calendar, Gauge, DollarSign, MapPin, Receipt } from "lucide-react";
import UploadToEarnModal from "../components/UploadToEarnModal";
import BulkBackfillModal from "../components/backfill/BulkBackfillModal";
import { SkeletonGrid } from "@/components/SkeletonLoader";
import MultiVehicleGate from "@/components/MultiVehicleGate";
import SharePricePrompt from "@/components/community/SharePricePrompt";

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

export default function Logbook() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_ENTRY);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [showUploadEarn, setShowUploadEarn] = useState(false);
  const [showBackfill, setShowBackfill] = useState(false);
  const [newPart, setNewPart] = useState({ part:"",brand:"",next_due_km:"",next_due_months:"" });
  const [sharePromptEntry, setSharePromptEntry] = useState(null);

  useEffect(() => {
    base44.entities.LogbookEntry.list("-service_date", 50).then(setEntries).finally(() => setLoading(false));
  }, []);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleReceiptExtracted = (data) => {
    setForm(p => ({
      ...p,
      mechanic_name: data.mechanic_name || p.mechanic_name,
      service_date: data.service_date || p.service_date,
      odometer: data.odometer ? String(data.odometer) : p.odometer,
      cost: data.cost ? String(data.cost) : p.cost,
      service_type: data.service_type || p.service_type,
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
    setSharePromptEntry(entry);
    toast.success("Entry saved to logbook.");
  };

  const handleDelete = async (id) => {
    await base44.entities.LogbookEntry.delete(id);
    setEntries(p => p.filter(e => e.id !== id));
    toast.success("Entry deleted.");
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

  const totalSpent = entries.reduce((sum, e) => sum + (e.cost || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Digital Car Logbook — Track Services & Reminders | ServCheck"
        description="Log every service, set maintenance reminders and upload receipts. Keep your car's full history in one place — free for Australian drivers."
        path="/logbook"
      />

      {/* Hero Header */}
      <div className="bg-[#1a237e] text-white px-4 pt-8 pb-16">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-1">Maintenance</p>
            <h1 className="font-heading font-black text-3xl leading-tight">Service Logbook</h1>
            <p className="text-blue-200 text-sm mt-1">Track maintenance, plan ahead & predict costs with AI</p>
          </motion.div>

          {/* Stats row */}
          {entries.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-3 gap-3 mt-6">
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <p className="font-heading font-black text-2xl">{entries.length}</p>
                <p className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold mt-0.5">Services</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <p className="font-heading font-black text-2xl">${totalSpent.toLocaleString()}</p>
                <p className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold mt-0.5">Total Spent</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <p className="font-heading font-black text-2xl">{entries[0]?.odometer ? `${Math.round(entries[0].odometer / 1000)}k` : "—"}</p>
                <p className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold mt-0.5">Last Odo</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main content — pulls up over the hero */}
      <div className="max-w-2xl mx-auto px-4 -mt-8 pb-24 space-y-4">

        {/* Add Entry button — wrapped in multi-vehicle gate */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <MultiVehicleGate>
            <Button
              onClick={() => setShowForm(!showForm)}
              variant={showForm ? "outline" : "default"}
              className="w-full h-12 font-heading font-bold text-base rounded-2xl shadow-lg"
            >
              {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Add Service Entry</>}
            </Button>
          </MultiVehicleGate>
        </motion.div>

        {/* Backfill Past History */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          onClick={() => setShowBackfill(true)}
          className="w-full rounded-2xl border border-border bg-card p-4 flex items-center gap-4 text-left shadow-sm hover:shadow-md transition-all group"
        >
          <div className="h-11 w-11 rounded-xl bg-[#1a237e]/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-5 w-5 text-[#1a237e]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-sm">Backfill Past History</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">Older car? Scan logbook pages or old invoices to add years of services at once</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/70 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
        </motion.button>

        {showBackfill && (
          <BulkBackfillModal
            defaultVehicle={entries[0]}
            onClose={() => setShowBackfill(false)}
            onSaved={() => {
              setShowBackfill(false);
              base44.entities.LogbookEntry.list("-service_date", 50).then(setEntries);
            }}
          />
        )}

        {showUploadEarn && (
          <UploadToEarnModal onClose={() => setShowUploadEarn(false)} onSuccess={() => setShowUploadEarn(false)} />
        )}

        {/* Earn Credits card */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => setShowUploadEarn(true)}
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 flex items-center gap-4 text-left shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-emerald-700 transition-all group"
        >
          <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-sm text-white">Earn 2 Free Credits</p>
            <p className="text-xs text-emerald-100 mt-0.5 leading-snug">Upload a past receipt — up to twice per month</p>
          </div>
          <ChevronRight className="h-5 w-5 text-white/70 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
        </motion.button>

        {sharePromptEntry && (
          <SharePricePrompt entry={sharePromptEntry} onDismiss={() => setSharePromptEntry(null)} />
        )}

        {/* AI Prediction */}
        {entries.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <AIServicePrediction entries={entries} />
          </motion.div>
        )}

        {/* Reminders */}
        {reminders.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border-b border-amber-100">
              <Bell className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-bold text-amber-800">Service Reminders</span>
              <span className="ml-auto text-xs font-semibold bg-amber-200 text-amber-800 rounded-full px-2 py-0.5">{reminders.length}</span>
            </div>
            <div className="p-3 space-y-2">
              {reminders.map((r, i) => {
                const s = getReminderStatus(r);
                return (
                  <div key={i} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${s.urgent ? "bg-red-50 border border-red-200" : s.warning ? "bg-amber-50 border border-amber-200" : "bg-secondary/40 border border-transparent"}`}>
                    <div>
                      <p className="font-semibold text-sm">{r.part}</p>
                      <p className="text-xs text-muted-foreground">{r.car}</p>
                    </div>
                    <div className="text-right text-xs">
                      {r.next_due_km && <p className="font-medium">Due: {r.next_due_km?.toLocaleString()} km</p>}
                      {s.kmLeft !== null && <p className={s.urgent ? "text-red-600 font-bold" : "text-muted-foreground"}>{s.kmLeft?.toLocaleString()} km left</p>}
                      {s.monthsLeft !== null && <p className={s.urgent ? "text-red-600 font-bold" : "text-muted-foreground"}>{s.monthsLeft}mo left</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Add Entry Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className="rounded-2xl border border-border bg-card overflow-hidden shadow-md"
            >
              <div className="px-5 py-4 border-b border-border bg-secondary/30">
                <p className="font-heading font-bold text-base">New Service Entry</p>
                <p className="text-xs text-muted-foreground mt-0.5">Fill in manually or scan a receipt below</p>
              </div>
              <div className="p-5">
                <div className="mb-5">
                  <ReceiptScanner onExtracted={handleReceiptExtracted} />
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Vehicle</p>
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
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Service Details</p>
                    <div className="space-y-3">
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
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Next Service</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Due at (km)</Label>
                        <Input type="number" placeholder="95000" value={form.next_service_km} onChange={e => update("next_service_km", e.target.value)} className="h-10 bg-secondary/50 border-0" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Due in (months)</Label>
                        <Input type="number" placeholder="12" value={form.next_service_months} onChange={e => update("next_service_months", e.target.value)} className="h-10 bg-secondary/50 border-0" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Notes <span className="font-normal text-muted-foreground/60">(do not include personal info)</span></Label>
                    <Input placeholder="e.g. engine noise resolved, needs new wiper blades" value={form.notes} onChange={e => update("notes", e.target.value)} className="h-10 bg-secondary/50 border-0" />
                  </div>

                  {/* Parts */}
                  <div className="rounded-xl border border-border p-4 space-y-3 bg-secondary/20">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Parts Replaced</p>
                    {form.parts_replaced.map((p, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 bg-background rounded-lg px-3 py-2 border border-border">
                        <div>
                          <p className="text-sm font-semibold">{p.part}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.brand && `${p.brand} · `}
                            {p.next_due_km && `Next: ${parseInt(p.next_due_km).toLocaleString()} km`}
                            {p.next_due_months && ` / ${p.next_due_months}mo`}
                          </p>
                        </div>
                        <button type="button" onClick={() => removePart(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={newPart.part} onValueChange={v => setNewPart(p => ({ ...p, part: v }))}>
                          <SelectTrigger className="h-9 bg-background border-border text-sm"><SelectValue placeholder="Select part" /></SelectTrigger>
                          <SelectContent>{COMMON_PARTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                        </Select>
                        <Input placeholder="Brand (optional)" value={newPart.brand} onChange={e => setNewPart(p => ({ ...p, brand: e.target.value }))} className="h-9 bg-background border-border text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="number" placeholder="Next due (km)" value={newPart.next_due_km} onChange={e => setNewPart(p => ({ ...p, next_due_km: e.target.value }))} className="h-9 bg-background border-border text-sm" />
                        <Input type="number" placeholder="Next due (months)" value={newPart.next_due_months} onChange={e => setNewPart(p => ({ ...p, next_due_months: e.target.value }))} className="h-9 bg-background border-border text-sm" />
                      </div>
                      <button type="button" onClick={addPart} disabled={!newPart.part} className="w-full h-9 rounded-lg border-2 border-dashed border-border text-muted-foreground text-xs font-semibold hover:border-accent hover:text-accent transition-colors disabled:opacity-40">
                        + Add Part
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={!form.car_make || !form.odometer || !form.service_date || !form.service_type || saving} className="w-full h-12 font-heading font-bold text-base rounded-xl">
                    {saving ? "Saving…" : "Save Entry"}
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Entries */}
        {loading ? (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 mb-3">Loading history…</p>
            <SkeletonGrid count={4} />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border-2 border-dashed border-border bg-card">
            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="font-heading font-bold text-lg text-foreground">No entries yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first service to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">History ({entries.length})</p>
            </div>
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <button onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)} className="w-full flex items-center justify-between px-4 py-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#1a237e]/10 flex items-center justify-center flex-shrink-0">
                      <Wrench className="h-4 w-4 text-[#1a237e]" />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-sm">{entry.car_year} {entry.car_make} {entry.car_model}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{entry.service_type}</span>
                        {entry.service_date && (
                          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />{entry.service_date}
                          </span>
                        )}
                        {entry.odometer && (
                          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Gauge className="h-3 w-3" />{entry.odometer?.toLocaleString()} km
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {entry.cost && (
                       <span className="font-heading font-black text-base text-[#1a237e]">${entry.cost?.toLocaleString()}</span>
                     )}
                     <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center">
                       {expandedId === entry.id
                         ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                         : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                     </div>
                  </div>
                </button>

                <AnimatePresence>
                  {expandedId === entry.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-3 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {entry.mechanic_name && (
                            <div className="bg-secondary/40 rounded-xl p-3">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Mechanic</p>
                              <p className="text-sm font-semibold">{entry.mechanic_name}</p>
                            </div>
                          )}
                          {entry.state && (
                            <div className="bg-secondary/40 rounded-xl p-3">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">State</p>
                              <p className="text-sm font-semibold">{entry.state}</p>
                            </div>
                          )}
                        </div>
                        {(entry.next_service_km || entry.next_service_months) && (
                          <div className="bg-accent/10 border border-accent/20 rounded-xl px-3 py-2.5">
                            <p className="text-xs font-bold text-accent">
                              Next service: {entry.next_service_km && `${entry.next_service_km?.toLocaleString()} km`}{entry.next_service_km && entry.next_service_months && " or "}{entry.next_service_months && `${entry.next_service_months} months`}
                            </p>
                          </div>
                        )}
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground bg-secondary/30 rounded-xl px-3 py-2.5">{entry.notes}</p>
                        )}
                        {entry.parts_replaced?.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Parts Replaced</p>
                            {entry.parts_replaced.map((p, i) => (
                              <div key={i} className="flex justify-between items-center text-sm bg-secondary/40 rounded-lg px-3 py-2">
                                <span className="font-medium">{p.part}{p.brand ? ` (${p.brand})` : ""}</span>
                                {p.next_due_km && <span className="text-xs text-muted-foreground">Due: {parseInt(p.next_due_km).toLocaleString()} km</span>}
                              </div>
                            ))}
                          </div>
                        )}

                        <button onClick={() => handleDelete(entry.id)} className="flex items-center gap-1.5 text-xs text-destructive/70 hover:text-destructive transition-colors pt-1 font-medium">
                          <Trash2 className="h-3.5 w-3.5" /> Delete entry
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}