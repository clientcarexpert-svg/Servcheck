import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Smartphone, ChevronRight, Loader2, CheckCircle2, Car, MapPin, AlertTriangle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SUBURBS_BY_STATE } from "@/lib/suburbs";

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

const PROBLEM_SUGGESTIONS = [
  "Engine warning light is on",
  "Strange clunking noise",
  "Grinding noise when braking",
  "Squealing noise",
  "Car won't start",
  "Rough idle or stalling",
  "Brakes feel soft",
  "Car is overheating",
  "Smoke from engine",
  "Air con not working",
  "Oil / fluid leak",
  "Transmission slipping",
];

export default function MobileDiagnosticRequest() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [carProfiles, setCarProfiles] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [notifiedCount, setNotifiedCount] = useState(0);

  const [form, setForm] = useState({
    car_profile_id: "",
    car_make: "",
    car_model: "",
    car_year: "",
    problem_description: "",
    state: "",
    suburb: "",
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const profiles = await base44.entities.CarProfile.filter({ created_by: u.email });
        setCarProfiles(profiles);
        if (profiles.length === 1) {
          const p = profiles[0];
          setForm(f => ({
            ...f,
            car_profile_id: p.id,
            car_make: p.car_make || "",
            car_model: p.car_model || "",
            car_year: p.car_year || "",
            state: p.state || "",
            suburb: p.suburb || "",
          }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingProfile(false);
      }
    };
    init();
  }, []);

  const selectCarProfile = (p) => {
    setForm(f => ({
      ...f,
      car_profile_id: p.id,
      car_make: p.car_make || "",
      car_model: p.car_model || "",
      car_year: p.car_year || "",
      state: p.state || f.state,
      suburb: p.suburb || f.suburb,
    }));
  };

  const availableSuburbs = form.state ? [...(SUBURBS_BY_STATE[form.state] || [])].sort() : [];

  const isValid = form.car_make && form.car_model && form.car_year &&
    form.problem_description.trim().length >= 5 && form.state && form.suburb;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
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

      // Notify mobile mechanics server-side (contact details stay private)
      const res = await base44.functions.invoke("notifyMobileMechanics", {
        diagnostic_request_id: request.id,
      });

      setNotifiedCount(res.data?.notified_count || 0);
      setDone(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#f97316] rounded-full animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="font-heading font-black text-2xl text-[#1a237e] mb-2">Request Sent!</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-2">
            <strong>{notifiedCount} mobile mechanic{notifiedCount !== 1 ? "s" : ""}</strong> in {form.suburb}, {form.state} have been notified.
          </p>
          <p className="text-slate-400 text-xs mb-8">
            They'll each submit a flat fee offer — for diagnosis only, or to fix the problem. You choose who to go with.
          </p>
          <div className="bg-slate-50 rounded-2xl p-4 text-left mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Your Request</p>
            <p className="text-sm font-semibold text-slate-800">{form.car_year} {form.car_make} {form.car_model}</p>
            <p className="text-xs text-slate-500 mt-1 italic">"{form.problem_description}"</p>
          </div>
          <Button onClick={() => navigate("/my-requests")}
            className="w-full h-12 rounded-2xl bg-[#1a237e] hover:bg-[#1e2d8f] text-white font-heading font-bold mb-3 gap-2">
            <MessageSquare className="h-5 w-5" /> View Offers in Messages
          </Button>
          <button onClick={() => navigate("/")} className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-2xl bg-[#1a237e] flex items-center justify-center">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-black text-xl text-[#1a237e] leading-tight">Mobile Mechanic Quotes</h1>
            <p className="text-xs text-slate-400">Mechanics come to you — diagnosis or full fix</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-xs text-blue-700 leading-relaxed">
          <strong>How it works:</strong> Nearby mobile mechanics get notified instantly and each submit a flat fee — either for a diagnosis visit, or to fix the problem. You pick the best offer.
        </div>
      </motion.div>

      <div className="space-y-6">

        {/* Car Selection */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
            <Car className="h-3.5 w-3.5" /> Your Car
          </p>

          {carProfiles.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {carProfiles.map(p => (
                <button key={p.id} onClick={() => selectCarProfile(p)}
                  className={`flex-shrink-0 rounded-xl border-2 px-4 py-2.5 text-left transition-all ${
                    form.car_profile_id === p.id
                      ? "border-[#f97316] bg-orange-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}>
                  <p className="font-bold text-sm text-slate-800 whitespace-nowrap">{p.car_year} {p.car_make}</p>
                  <p className="text-xs text-slate-500">{p.car_model}</p>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-[#1a237e] font-bold">Make</label>
              <Input value={form.car_make} onChange={e => update("car_make", e.target.value)}
                placeholder="Toyota" className="h-11 bg-white border-2 border-[#1a237e] text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus-visible:ring-[#f97316]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#1a237e] font-bold">Model</label>
              <Input value={form.car_model} onChange={e => update("car_model", e.target.value)}
                placeholder="Corolla" className="h-11 bg-white border-2 border-[#1a237e] text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus-visible:ring-[#f97316]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#1a237e] font-bold">Year</label>
              <Input value={form.car_year} onChange={e => update("car_year", e.target.value)}
                placeholder="2019" className="h-11 bg-white border-2 border-[#1a237e] text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus-visible:ring-[#f97316]" />
            </div>
          </div>
        </motion.div>

        {/* Problem */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" /> What's the problem?
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PROBLEM_SUGGESTIONS.map(s => (
              <button key={s} type="button" onClick={() => update("problem_description", s)}
                className={`text-xs px-2.5 py-1.5 rounded-full border font-medium transition-colors ${
                  form.problem_description === s
                    ? "bg-[#f97316] text-white border-[#f97316]"
                    : "bg-slate-100 hover:bg-orange-50 hover:text-orange-700 border-slate-200 hover:border-orange-300 text-slate-600"
                }`}>
                {s}
              </button>
            ))}
          </div>
          <textarea
            value={form.problem_description}
            onChange={e => update("problem_description", e.target.value)}
            placeholder="Or describe in your own words..."
            rows={3}
            className="w-full rounded-xl bg-white border-2 border-[#1a237e] px-3 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          />
        </motion.div>

        {/* Location */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" /> Your Location
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[#1a237e] font-bold">State</label>
              <select value={form.state} onChange={e => { update("state", e.target.value); update("suburb", ""); }}
                className="w-full h-11 rounded-xl bg-white border-2 border-[#1a237e] px-3 font-semibold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f97316] appearance-none">
                <option value="">Select...</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#1a237e] font-bold">Suburb</label>
              <select value={form.suburb} onChange={e => update("suburb", e.target.value)}
                disabled={!form.state}
                className="w-full h-11 rounded-xl bg-white border-2 border-[#1a237e] px-3 font-semibold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f97316] appearance-none disabled:opacity-40">
                <option value="">Select...</option>
                {availableSuburbs.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          {form.suburb === "Other" && (
            <Input placeholder="Type your suburb..."
              className="h-11 bg-slate-50 border-slate-200 font-medium mt-2"
              onChange={e => update("suburb", e.target.value)} />
          )}
        </motion.div>

        {/* Submit */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Button onClick={handleSubmit} disabled={!isValid || submitting}
            className="w-full h-14 rounded-2xl bg-[#f97316] hover:bg-[#ea6c0a] text-white font-heading font-bold text-base shadow-lg shadow-orange-200 disabled:opacity-50 gap-2">
            {submitting
              ? <><Loader2 className="h-5 w-5 animate-spin" /> Sending to nearby mechanics...</>
              : <>Notify Nearby Mobile Mechanics <ChevronRight className="h-5 w-5" /></>
            }
          </Button>
          <p className="text-center text-xs text-slate-400 mt-2">Free · No obligation · Pick the best offer</p>
        </motion.div>
      </div>
    </div>
  );
}