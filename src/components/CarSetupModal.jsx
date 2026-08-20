import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Car } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CAR_MAKES_MODELS, CAR_MAKES, getVariants, getAvailableFuelTypes, getAvailableTransmissions, MAKE_FIRST_YEAR, MODEL_BODY_STYLES } from "@/lib/carData";

const ALL_BODY_STYLES = ["Sedan", "Hatchback", "SUV / Crossover", "Ute / Pickup", "Wagon", "Coupe", "Convertible", "Van / People Mover", "Other"];

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

const SERVICE_HISTORY_OPTIONS = [
  { value: "full_dealer", label: "Full dealer history" },
  { value: "partial", label: "Partial history" },
  { value: "logbook_only", label: "Logbook only" },
  { value: "none", label: "No history" },
  { value: "unknown", label: "Unknown" },
];

const sel = "h-11 w-full rounded-lg bg-slate-100 border-0 px-3 font-medium text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent appearance-none cursor-pointer";

export default function CarSetupModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    car_make: "", car_model: "", car_year: "", variant: "", body_style: "",
    rego: "", color: "", state: "", suburb: "",
    transmission: "", fuel_type: "", service_history: "",
    known_issues: "", last_service_date: "", last_service_odometer: "",
    last_odometer: ""
  });
  const [saving, setSaving] = useState(false);

  const set = (f, v) => setForm(p => {
    const next = { ...p, [f]: v };
    if (f === "car_make") { next.car_model = ""; next.variant = ""; next.body_style = ""; next.fuel_type = ""; next.transmission = ""; }
    if (f === "car_model") { next.variant = ""; next.body_style = ""; next.fuel_type = ""; next.transmission = ""; }
    if (f === "car_year") { next.variant = ""; next.fuel_type = ""; next.transmission = ""; }
    if (f === "fuel_type") { next.transmission = ""; }
    return next;
  });

  const availableModels = form.car_make ? (CAR_MAKES_MODELS[form.car_make] || []) : [];
  const bodyStyleOptions = (form.car_make && form.car_model)
    ? (MODEL_BODY_STYLES[`${form.car_make}-${form.car_model}`] || ALL_BODY_STYLES)
    : ALL_BODY_STYLES;
  const fuelTypeOptions = getAvailableFuelTypes(form.car_make, form.car_model, form.car_year);
  const transmissionOptions = getAvailableTransmissions(form.car_make, form.car_model, form.car_year, form.fuel_type);
  const firstYear = form.car_make ? (MAKE_FIRST_YEAR[form.car_make] || 1980) : 1980;
  const currentYear = 2025;
  const validYears = Array.from({ length: currentYear - firstYear + 1 }, (_, i) => String(currentYear - i));
  const yearInvalid = form.car_year && form.car_make && !validYears.includes(form.car_year);

  const handleSave = async () => {
    if (!form.car_make || !form.car_model || !form.car_year) {
      toast.error("Please fill in make, model and year");
      return;
    }
    setSaving(true);
    const profile = await base44.entities.CarProfile.create({
      profile_name: `${form.car_year} ${form.car_make} ${form.car_model}`,
      car_make: form.car_make,
      car_model: form.car_model,
      car_year: form.car_year,
      variant: form.variant || undefined,
      notes: form.body_style ? `Body style: ${form.body_style}` : undefined,
      rego: form.rego || undefined,
      color: form.color || undefined,
      state: form.state || undefined,
      suburb: form.suburb || undefined,
      transmission: form.transmission || undefined,
      fuel_type: form.fuel_type || undefined,
      service_history: form.service_history || undefined,
      known_issues: form.known_issues || undefined,
      last_service_date: form.last_service_date || undefined,
      last_service_odometer: form.last_service_odometer ? parseInt(form.last_service_odometer) : undefined,
      last_odometer: form.last_odometer ? parseInt(form.last_odometer) : undefined,
    });
    setSaving(false);
    toast.success("Car profile created!");
    onSaved(profile);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100dvh - 120px)' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a237e] to-[#1565c0] p-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg">Set Up Your Car</h2>
                <p className="text-blue-200 text-xs">Track your car's live market value</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="p-4 space-y-2.5 overflow-y-auto flex-1 overscroll-contain"
          onTouchStart={e => e.stopPropagation()}
        >
          <p className="text-sm text-slate-500 leading-relaxed">
            Add your car to unlock the <strong className="text-slate-800">Equity Meter</strong> — a live resale value tracker.
          </p>

          {/* Make */}
          <select value={form.car_make} onChange={e => set("car_make", e.target.value)} className={sel}>
            <option value="" disabled>Make *</option>
            {CAR_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {/* Model — dropdown once make selected */}
          {form.car_make ? (
            <select value={form.car_model} onChange={e => set("car_model", e.target.value)} className={sel}>
              <option value="" disabled>Model *</option>
              {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
              <option value="Other">Other</option>
            </select>
          ) : (
            <select disabled className={`${sel} opacity-40 cursor-not-allowed`}>
              <option>Select make first</option>
            </select>
          )}

          {form.car_model === "Other" && (
            <Input placeholder="Enter model name" value={form._customModel || ""} onChange={e => setForm(p => ({ ...p, _customModel: e.target.value, car_model: e.target.value }))} className="h-11 bg-slate-100 border-0 font-medium" />
          )}

          {/* Year */}
          <select value={form.car_year} onChange={e => set("car_year", e.target.value)} className={`${sel} ${yearInvalid ? 'ring-2 ring-red-400' : ''}`}>
            <option value="" disabled>Year *</option>
            {validYears.map(yr => <option key={yr} value={yr}>{yr}</option>)}
          </select>
          {yearInvalid && (
            <p className="text-xs text-red-500 font-semibold -mt-1">⚠️ {form.car_make} was not available in {form.car_year}.</p>
          )}

          {/* Variant — smart dropdown from shared carData */}
          {(() => {
            const variantOpts = getVariants(form.car_make, form.car_model, form.car_year);
            if (variantOpts.length > 0) {
              return (
                <>
                  <select value={form.variant} onChange={e => set("variant", e.target.value)} className={sel}>
                    <option value="">Variant / Engine (optional)</option>
                    {variantOpts.map(v => <option key={v} value={v}>{v}</option>)}
                    <option value="__other__">Other / Not Listed</option>
                  </select>
                  {form.variant === "__other__" && (
                    <Input placeholder="Enter variant / trim..." value={form._customVariant || ""} onChange={e => setForm(p => ({ ...p, _customVariant: e.target.value, variant: e.target.value }))} className="h-11 bg-slate-100 border-0 font-medium" />
                  )}
                </>
              );
            }
            return <Input placeholder="Variant / Trim (e.g. Ascent, GLX) — optional" value={form.variant} onChange={e => set("variant", e.target.value)} className="h-11 bg-slate-100 border-0 font-medium" />;
          })()}

          {/* Body Style */}
          <select value={form.body_style} onChange={e => set("body_style", e.target.value)} className={sel}>
            <option value="">Body Style (optional)</option>
            {bodyStyleOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Fuel Type */}
          <select value={form.fuel_type} onChange={e => set("fuel_type", e.target.value)} className={sel}>
            <option value="">Fuel Type (optional)</option>
            {fuelTypeOptions.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          {/* Transmission */}
          <select value={form.transmission} onChange={e => set("transmission", e.target.value)} className={sel}>
            <option value="">Transmission (optional)</option>
            {transmissionOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Rego / Colour */}
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Rego (optional)" value={form.rego} onChange={e => set("rego", e.target.value)} className="h-11 bg-slate-100 border-0 font-medium" />
            <Input placeholder="Colour (optional)" value={form.color} onChange={e => set("color", e.target.value)} className="h-11 bg-slate-100 border-0 font-medium" />
          </div>

          {/* State / Suburb */}
          <div className="grid grid-cols-2 gap-2">
            <select value={form.state} onChange={e => set("state", e.target.value)} className={sel}>
              <option value="" disabled>State</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Input placeholder="Suburb (optional)" value={form.suburb} onChange={e => set("suburb", e.target.value)} className="h-11 bg-slate-100 border-0 font-medium" />
          </div>

          {/* Service history */}
          <select value={form.service_history} onChange={e => set("service_history", e.target.value)} className={sel}>
            <option value="" disabled>Service History</option>
            {SERVICE_HISTORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Last service */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[11px] text-slate-400 mb-1">Last service date</p>
              <Input type="date" value={form.last_service_date} onChange={e => set("last_service_date", e.target.value)} className="h-11 bg-slate-100 border-0 font-medium" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 mb-1">Last service km</p>
              <Input type="number" placeholder="e.g. 80000" value={form.last_service_odometer} onChange={e => set("last_service_odometer", e.target.value)} className="h-11 bg-slate-100 border-0 font-medium" />
            </div>
          </div>

          {/* Current odometer */}
          <Input type="number" placeholder="Current odometer km (optional)" value={form.last_odometer} onChange={e => set("last_odometer", e.target.value)} className="h-11 bg-slate-100 border-0 font-medium" />

          {/* Known issues */}
          <textarea
            placeholder="Known issues — e.g. air con not cold, slight rust on sills (optional)"
            value={form.known_issues}
            onChange={e => set("known_issues", e.target.value)}
            rows={2}
            className="w-full rounded-lg bg-slate-100 border-0 px-3 py-2.5 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
        </div>

        {/* Footer */}
        <div className="p-3 flex-shrink-0 border-t border-slate-100">
          <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-[#f97316] hover:bg-[#ea6c0a] text-white font-bold font-heading text-base">
            {saving ? "Saving..." : "Activate My Equity Meter →"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}