import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SUBURBS_BY_STATE } from "@/lib/suburbs";

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

const CAR_MAKES = [
  "Toyota", "Mazda", "Hyundai", "Kia", "Ford", "Holden", "Mitsubishi", "Nissan",
  "Subaru", "Honda", "Volkswagen", "BMW", "Mercedes", "Audi", "Lexus", "Isuzu",
  "Jeep", "Suzuki", "Volvo", "Peugeot", "Renault", "Tesla", "GWM", "MG", "BYD",
  "Porsche", "Land Rover", "Skoda", "Other"
].sort();

const STEPS = ["Your Car", "The Problem", "Your Location"];

const PROBLEM_SUGGESTIONS = [
  "Engine warning light is on",
  "Making a strange clunking noise",
  "Making a grinding noise when braking",
  "Making a squealing noise",
  "Car won't start",
  "Rough idle or stalling",
  "Brakes feel soft",
  "Car is overheating",
  "Smoke from engine",
  "Air con not working",
  "Oil leak / fluid leak",
  "Transmission slipping",
];

// mechanicType: "mobile_mechanic" | null (null = all types)
export default function DiagnosticRequestModal({ onClose, prefillCar, mechanicType }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    car_make: prefillCar?.car_make || "",
    car_model: prefillCar?.car_model || "",
    car_year: prefillCar?.car_year || "",
    problem_description: "",
    state: "",
    suburb: "",
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const goNext = () => { setDirection(1); setStep(s => s + 1); };
  const goBack = () => { setDirection(-1); setStep(s => s - 1); };

  const step0Valid = form.car_make && form.car_model && form.car_year;
  const step1Valid = form.problem_description.trim().length >= 5;
  const step2Valid = form.state && form.suburb;
  const stepValid = [step0Valid, step1Valid, step2Valid];

  const availableSuburbs = form.state ? [...(SUBURBS_BY_STATE[form.state] || [])].sort() : [];

  const isMobileOnly = mechanicType === "mobile_mechanic";

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      if (!user) {
        toast.error("Please log in to submit a request.");
        setLoading(false);
        return;
      }

      const request = await base44.entities.DiagnosticRequest.create({
        user_email: user.email,
        user_full_name: user.full_name || "",
        car_make: form.car_make,
        car_model: form.car_model,
        car_year: form.car_year,
        problem_description: form.problem_description,
        state: form.state,
        suburb: form.suburb,
        status: "open",
      });

      // Filter mechanics by state + active, and optionally by type
      const filterObj = { state: form.state, is_active: true };
      if (mechanicType) filterObj.mechanic_type = mechanicType;

      const mechanics = await base44.entities.MechanicProfile.filter(filterObj, null, 100);

      const notifPromises = mechanics.map(m =>
        base44.entities.MechanicNotification.create({
          mechanic_profile_id: m.id,
          mechanic_email: m.user_email,
          title: "New Diagnostic Request",
          message: `${form.car_year} ${form.car_make} ${form.car_model} in ${form.suburb}, ${form.state}. Problem: "${form.problem_description.slice(0, 80)}". Submit a flat fee offer!`,
          type: "quote_request",
          is_read: false,
          quote_request_id: request.id,
        })
      );

      await Promise.all(notifPromises);
      setDone(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (d) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-[#1a237e] flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-heading font-black text-[#1a237e] text-sm leading-tight">
                  {isMobileOnly ? "Get Mobile Mechanic Quotes" : "Get Mechanic Quotes"}
                </p>
                {!done && <p className="text-[11px] text-slate-400">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>}
              </div>
            </div>
            <button onClick={onClose} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all">
              <X className="h-4 w-4" />
            </button>
          </div>

          {!done && (
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className="transition-all duration-300 rounded-full h-1"
                  style={{ flex: i === step ? 3 : 1, background: i < step ? '#1a237e' : i === step ? '#f97316' : '#e2e8f0' }} />
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {done ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="font-heading font-black text-xl text-[#1a237e] mb-2">Request Sent!</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                {isMobileOnly ? "Mobile mechanics" : "All local mechanics"} in <strong>{form.suburb}, {form.state}</strong> have been notified. They'll submit flat fee offers — you can review and choose who to go with.
              </p>
              <div className="bg-slate-50 rounded-2xl p-4 text-left mb-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Your Request</p>
                <p className="text-sm font-semibold text-slate-800">{form.car_year} {form.car_make} {form.car_model}</p>
                <p className="text-xs text-slate-500 mt-1">"{form.problem_description}"</p>
              </div>
              <Button onClick={onClose} className="w-full h-12 rounded-2xl bg-[#1a237e] hover:bg-[#1e2d8f] text-white font-heading font-bold">
                Done — I'll Check My Offers
              </Button>
            </motion.div>
          ) : (
            <div className="overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>

                {/* STEP 0: Your Car */}
                {step === 0 && (
                  <motion.div key="s0" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.22, ease: "easeOut" }} className="space-y-4">
                    <div>
                      <p className="font-heading font-black text-xl text-[#1a237e] mb-1">Your Car</p>
                      <p className="text-sm text-slate-500">Let mechanics know what they'll be working on.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Make</label>
                      <select value={form.car_make} onChange={e => update("car_make", e.target.value)}
                        className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-3 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-none cursor-pointer">
                        <option value="">Select make...</option>
                        {CAR_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>

                    {form.car_make && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Model</label>
                        <Input value={form.car_model} onChange={e => update("car_model", e.target.value)}
                          placeholder="e.g. Corolla, Ranger, CX-5"
                          className="h-12 bg-slate-50 border-slate-200 font-medium" />
                      </div>
                    )}

                    {form.car_model && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Year</label>
                        <select value={form.car_year} onChange={e => update("car_year", e.target.value)}
                          className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-3 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-none cursor-pointer">
                          <option value="">Select year...</option>
                          {Array.from({ length: 35 }, (_, i) => String(2025 - i)).map(yr => (
                            <option key={yr} value={yr}>{yr}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 1: The Problem */}
                {step === 1 && (
                  <motion.div key="s1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.22, ease: "easeOut" }} className="space-y-4">
                    <div>
                      <p className="font-heading font-black text-xl text-[#1a237e] mb-1">What's going on?</p>
                      <p className="text-sm text-slate-500">Tap a suggestion or type a brief description.</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Tap to select</p>
                      <div className="flex flex-wrap gap-1.5">
                        {PROBLEM_SUGGESTIONS.map(s => (
                          <button key={s} type="button"
                            onClick={() => update("problem_description", s)}
                            className={`text-xs px-2.5 py-1.5 rounded-full border font-medium transition-colors ${
                              form.problem_description === s
                                ? "bg-orange-500 text-white border-orange-500"
                                : "bg-slate-100 hover:bg-orange-50 hover:text-orange-700 border-slate-200 hover:border-orange-300 text-slate-600"
                            }`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Or describe in your own words</label>
                      <textarea
                        value={form.problem_description}
                        onChange={e => update("problem_description", e.target.value)}
                        placeholder="e.g. Makes a clunking noise when turning left..."
                        rows={3}
                        className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Location */}
                {step === 2 && (
                  <motion.div key="s2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.22, ease: "easeOut" }} className="space-y-4">
                    <div>
                      <p className="font-heading font-black text-xl text-[#1a237e] mb-1">Your Location</p>
                      <p className="text-sm text-slate-500">
                        {isMobileOnly
                          ? "We'll notify mobile mechanics in your area."
                          : "We'll notify all local mechanics in your area."}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">State</label>
                      <select value={form.state} onChange={e => { update("state", e.target.value); update("suburb", ""); }}
                        className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-3 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-none cursor-pointer">
                        <option value="">Select state...</option>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {form.state && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Suburb</label>
                        <select value={form.suburb} onChange={e => update("suburb", e.target.value)}
                          className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-3 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-none cursor-pointer">
                          <option value="">Select suburb...</option>
                          {availableSuburbs.map(s => <option key={s} value={s}>{s}</option>)}
                          <option value="Other">Other</option>
                        </select>
                        {form.suburb === "Other" && (
                          <Input placeholder="Type suburb..." className="h-12 bg-slate-50 border-slate-200 font-medium"
                            onChange={e => update("suburb", e.target.value)} />
                        )}
                      </div>
                    )}

                    {step2Valid && (
                      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm text-slate-700">
                        <p className="font-bold text-orange-700 mb-1 text-xs uppercase tracking-widest">What happens next</p>
                        <ul className="space-y-1 text-xs text-slate-600">
                          <li>✅ {isMobileOnly ? "Mobile mechanics" : "All mechanics"} in <strong>{form.state}</strong> get notified instantly</li>
                          <li>✅ Each mechanic can submit a flat fee offer</li>
                          <li>✅ You review all offers and choose who to go with</li>
                          <li>✅ No obligation — completely free</li>
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {!done && (
          <div className="flex-shrink-0 px-5 pb-5 pt-2 flex gap-3">
            {step > 0 && (
              <Button variant="outline" onClick={goBack} className="h-13 px-4 rounded-2xl border-slate-200 flex items-center gap-1 font-semibold">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={goNext} disabled={!stepValid[step]}
                className="flex-1 h-13 rounded-2xl bg-[#f97316] hover:bg-[#ea6c0a] text-white font-heading font-bold text-base flex items-center justify-center gap-2 shadow-md shadow-orange-200 disabled:opacity-50 transition-all py-3">
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!step2Valid || loading}
                className="flex-1 h-13 rounded-2xl bg-[#1a237e] hover:bg-[#1e2d8f] text-white font-heading font-bold text-base flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all py-3">
                {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Sending...</> : <>Send to {isMobileOnly ? "Mobile Mechanics" : "Local Mechanics"} <ChevronRight className="h-5 w-5" /></>}
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}