import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronLeft, Zap } from "lucide-react";
import { SUBURBS_BY_STATE } from "@/lib/suburbs";
import { MAKE_FIRST_YEAR } from "@/lib/carData";

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

const CAR_MAKES_MODELS = {
  Toyota: ["Camry", "Corolla", "HiLux", "Kluger", "LandCruiser", "Prado", "RAV4", "Yaris", "Prius", "Tarago", "Fortuner", "Aurion", "C-HR", "86"],
  Mazda: ["CX-3", "CX-5", "CX-8", "CX-9", "Mazda2", "Mazda3", "Mazda6", "MX-5", "BT-50"],
  Ford: ["Everest", "Explorer", "Falcon", "Mustang", "Ranger", "Transit", "Focus", "Fiesta", "Escape", "Territory"],
  Holden: ["Astra", "Captiva", "Colorado", "Commodore", "Cruze", "Trailblazer", "Trax"],
  Hyundai: ["Accent", "Elantra", "i20", "i30", "i40", "iX35", "Kona", "Santa Fe", "Sonata", "Tucson", "Veloster"],
  Kia: ["Carnival", "Cerato", "Optima", "Rio", "Seltos", "Sorento", "Sportage", "Stinger", "Stonic"],
  Mitsubishi: ["ASX", "Eclipse Cross", "Lancer", "Outlander", "Pajero", "Pajero Sport", "Triton"],
  Nissan: ["Dualis", "Juke", "Leaf", "Murano", "Navara", "Pathfinder", "Patrol", "Pulsar", "Qashqai", "X-Trail"],
  Subaru: ["BRZ", "Forester", "Impreza", "Legacy", "Liberty", "Outback", "WRX", "XV"],
  Honda: ["Accord", "City", "Civic", "CR-V", "HR-V", "Jazz", "Odyssey", "Pilot"],
  Volkswagen: ["Amarok", "Golf", "Passat", "Polo", "Tiguan", "Touareg"],
  BMW: ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "X1", "X3", "X5"],
  "Mercedes-Benz": ["A-Class", "B-Class", "C-Class", "E-Class", "GLA", "GLC", "GLE", "S-Class"],
  Audi: ["A1", "A3", "A4", "A6", "Q2", "Q3", "Q5", "Q7"],
  Lexus: ["IS", "ES", "GS", "LS", "NX", "RX", "UX"],
  Jeep: ["Cherokee", "Compass", "Grand Cherokee", "Renegade", "Wrangler"],
  Suzuki: ["Baleno", "Ignis", "Jimny", "S-Cross", "Swift", "Vitara"],
  Isuzu: ["D-Max", "MU-X"],
  LDV: ["D90", "G10", "T60"],
  GWM: ["Cannon", "Haval H6", "Haval Jolion", "Ute"],
  Tesla: ["Model 3", "Model S", "Model X", "Model Y"],
};

const CAR_MAKES = Object.keys(CAR_MAKES_MODELS).sort();

const STEPS = ["The Car", "Price & KMs", "Registration", "Summary"];

const selectClass = "w-full h-12 rounded-lg bg-secondary/50 border-0 px-3 font-medium text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent";

const slideVariants = {
  enter: (d) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
};

const DEFAULT_FORM = {
  car_make: "", car_model: "", car_year: "",
  odometer: "", asking_price: "",
  state: "", suburb: "",
  rego_expiry: "", service_history: "", known_issues: "", num_owners: "", transmission: "",
};

export default function BuyCarForm({ onSubmit, onReset }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState(DEFAULT_FORM);

  const update = (f, v) => setForm(p => {
    const updated = { ...p, [f]: v };
    if (f === "car_make") { updated.car_model = ""; }
    if (f === "state") { updated.suburb = ""; }
    return updated;
  });

  const effectiveMake = form.car_make;
  const availableModels = form.car_make ? (CAR_MAKES_MODELS[form.car_make] || []) : [];
  const availableSuburbs = form.state ? [...(SUBURBS_BY_STATE[form.state] || [])].sort() : [];

  const step0Valid = form.car_make && form.car_model && form.car_year;
  const step1Valid = form.odometer && form.asking_price;
  const step2Valid = form.state && form.suburb && form.suburb.trim().length > 0;
  const step3Valid = true;
  const stepValid = [step0Valid, step1Valid, step2Valid, step3Valid];

  const goNext = () => { setDirection(1); setStep(s => s + 1); };
  const goBack = () => { setDirection(-1); setStep(s => s - 1); };

  const handleSubmit = () => {
    onSubmit({ ...form, car_make: effectiveMake });
  };

  const handleReset = () => {
    setStep(0);
    setForm(DEFAULT_FORM);
    onReset?.();
  };

  const progress = ((step + (stepValid[step] ? 1 : 0)) / STEPS.length) * 100;

  return (
    <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Market Analysis</p>
        <h1 className="font-heading font-black text-3xl text-[#1a237e] leading-tight mb-1.5">Is This Car Worth It?</h1>
        <p className="text-slate-500 text-sm">Get a detailed valuation, upcoming costs & red flags before you buy</p>
      </motion.div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center gap-1.5 mb-3">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 transition-all duration-300 rounded-full" style={{ height: 3, background: i < step ? '#1a237e' : i === step ? '#f97316' : '#e2e8f0' }} />
          ))}
        </div>
        <div className="flex justify-between">
          {STEPS.map((s, i) => (
            <span key={s} className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
              i === step ? "text-[#f97316]" : i < step ? "text-[#1a237e]" : "text-slate-300"
            }`}>{s}</span>
          ))}
        </div>
      </div>

      <div className="overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 0 && <Step0Car key="step0" form={form} update={update} direction={direction} availableModels={availableModels} />}
          {step === 1 && <Step1PriceKm key="step1" form={form} update={update} direction={direction} />}
          {step === 2 && <Step2Registration key="step2" form={form} update={update} direction={direction} availableSuburbs={availableSuburbs} />}
          {step === 3 && <Step3Summary key="step3" form={form} update={update} direction={direction} />}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <Button type="button" variant="outline" onClick={goBack} className="h-12 px-4 flex items-center gap-1 font-semibold">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={goNext} disabled={!stepValid[step]}
            className="flex-1 h-12 bg-accent hover:bg-accent/90 text-white font-heading font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-accent/20 disabled:shadow-none">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit}
            className="flex-1 h-12 bg-accent hover:bg-accent/90 text-white font-heading font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-accent/20">
            Analyse Car <Zap className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Step Components
function Step0Car({ form, update, direction, availableModels }) {
  return (
    <motion.div key="step0" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
      transition={{ duration: 0.22, ease: "easeOut" }} className="space-y-5">
      <div className="mb-3">
        <p className="text-3xl font-heading font-black text-foreground mb-2">The Car</p>
        <p className="text-base text-muted-foreground font-medium">Tell us what you're looking at buying.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Make</label>
        <select value={form.car_make} onChange={e => update("car_make", e.target.value)} className={selectClass}>
          <option value="">Select make...</option>
          {CAR_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
          <option value="Other">Other</option>
        </select>
      </div>

      {form.car_make && (
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Model</label>
          {form.car_make === "Other" ? (
            <Input placeholder="Type model..." value={form.car_model} onChange={e => update("car_model", e.target.value)} className="h-12 bg-secondary/50 border-0 font-medium" />
          ) : (
            <select value={form.car_model} onChange={e => update("car_model", e.target.value)} className={selectClass}>
              <option value="">Select model...</option>
              {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
              <option value="Other">Other</option>
            </select>
          )}
        </div>
      )}

      {form.car_model && (
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Year</label>
          <select value={form.car_year} onChange={e => update("car_year", e.target.value)} className={selectClass}>
            <option value="">Select year...</option>
            {(() => {
              const firstYear = MAKE_FIRST_YEAR[form.car_make] || 1990;
              const currentYear = 2025;
              const years = [];
              for (let y = currentYear; y >= firstYear; y--) {
                years.push(String(y));
              }
              return years.map(yr => <option key={yr} value={yr}>{yr}</option>);
            })()}
          </select>
        </div>
      )}

      {form.car_year && (
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Transmission</label>
          <select value={form.transmission} onChange={e => update("transmission", e.target.value)} className={selectClass}>
            <option value="">Select transmission...</option>
            <option value="auto">Automatic</option>
            <option value="manual">Manual</option>
            <option value="cvt">CVT</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      )}
    </motion.div>
  );
}

function Step1PriceKm({ form, update, direction }) {
  return (
    <motion.div key="step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
      transition={{ duration: 0.22, ease: "easeOut" }} className="space-y-5">
      <div>
        <p className="text-lg font-heading font-bold mb-1">Price & Odometer</p>
        <p className="text-sm text-muted-foreground">How much are they asking and how far has it done?</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Asking Price (AUD)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
          <Input type="number" placeholder="0" value={form.asking_price} onChange={e => update("asking_price", e.target.value)} className="h-12 bg-secondary/50 border-0 font-medium pl-7" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Odometer (km)</label>
        <Input type="number" placeholder="e.g. 120000" value={form.odometer} onChange={e => update("odometer", e.target.value)} className="h-12 bg-secondary/50 border-0 font-medium" />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Number of Previous Owners</label>
        <Input type="number" placeholder="e.g. 2" value={form.num_owners} onChange={e => update("num_owners", e.target.value)} className="h-12 bg-secondary/50 border-0 font-medium" />
      </div>
    </motion.div>
  );
}

function Step2Registration({ form, update, direction, availableSuburbs }) {
  return (
    <motion.div key="step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
      transition={{ duration: 0.22, ease: "easeOut" }} className="space-y-5">
      <div>
        <p className="text-lg font-heading font-bold mb-1">Registration & Location</p>
        <p className="text-sm text-muted-foreground">Where is the car and when does the rego expire?</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">State</label>
        <select value={form.state} onChange={e => update("state", e.target.value)} className={selectClass}>
          <option value="">Select state...</option>
          {["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {form.state && (
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Suburb</label>
          <input
            list={`suburbs-buycar-${form.state}`}
            value={form.suburb}
            onChange={e => update("suburb", e.target.value)}
            placeholder="Type or search suburb..."
            className={selectClass}
            autoComplete="off"
          />
          <datalist id={`suburbs-buycar-${form.state}`}>
            {availableSuburbs.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rego Expiry (optional)</label>
        <Input placeholder="e.g. 09/2025" value={form.rego_expiry} onChange={e => update("rego_expiry", e.target.value)} className="h-12 bg-secondary/50 border-0 font-medium" />
      </div>
    </motion.div>
  );
}

function Step3Summary({ form, update, direction }) {
  return (
    <motion.div key="step3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
      transition={{ duration: 0.22, ease: "easeOut" }} className="space-y-5">
      <div>
        <p className="text-lg font-heading font-bold mb-1">Service History & Issues</p>
        <p className="text-sm text-muted-foreground">Almost done — add what you know about the car's history.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Service History</label>
        <select value={form.service_history} onChange={e => update("service_history", e.target.value)} className={selectClass}>
          <option value="">Select service history...</option>
          <option value="full_dealer">Full dealer history</option>
          <option value="partial">Partial history</option>
          <option value="logbook_only">Logbook only</option>
          <option value="none">No history</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Known Issues / What Seller Said</label>
        <Input placeholder="e.g. 'needs tyres', 'AC not working', 'nothing disclosed'" value={form.known_issues} onChange={e => update("known_issues", e.target.value)} className="h-12 bg-secondary/50 border-0 font-medium" />
      </div>

      <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-2 text-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Your Car Summary</p>
        <p><span className="font-semibold">{form.car_year} {form.car_make} {form.car_model}</span></p>
        <p className="text-muted-foreground">${parseInt(form.asking_price || 0).toLocaleString()} · {parseInt(form.odometer || 0).toLocaleString()} km · {form.suburb ? form.suburb + ", " : ""}{form.state}</p>
      </div>
    </motion.div>
  );
}