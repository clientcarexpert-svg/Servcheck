import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { X, Camera, FileText, ShieldCheck, Sparkles, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// step: "upload" | "processing" | "success" | "limit_reached"
export default function UploadToEarnModal({ onClose, onSuccess }) {
  const [step, setStep] = useState("upload");
  const [extracted, setExtracted] = useState(null);
  const [uploadsThisMonth, setUploadsThisMonth] = useState(null);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  // Server-side limit check on mount — open directly to limit_reached if already at cap
  useEffect(() => {
    base44.functions.invoke("processReceiptUpload", { check_only: true })
      .then(res => {
        const count = res.data?.uploads_this_month ?? 0;
        setUploadsThisMonth(count);
        if (count >= (res.data?.limit ?? 2)) setStep("limit_reached");
      })
      .catch(() => {});
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setStep("processing");

    try {
      const user = await base44.auth.me();

      // Upload to PRIVATE storage for extraction only — the server discards the file after processing
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });

      // All checks (monthly limit, duplicates), extraction, credit award and audit
      // logging happen server-side in processReceiptUpload.
      let res;
      try {
        res = await base44.functions.invoke("processReceiptUpload", { file_uri });
      } catch (err) {
        const d = err?.response?.data;
        if (d?.limit_reached) { setStep("limit_reached"); return; }
        toast.error(d?.error || "Something went wrong. Please try again.");
        setStep("upload");
        return;
      }

      const data = res.data?.data || {};
      const newTotal = res.data?.credits ?? 0;
      setUploadsThisMonth(res.data?.uploads_this_month ?? null);
      localStorage.setItem("servcheck_credits", String(newTotal));
      window.dispatchEvent(new Event("credits-updated"));

      // Update car profile + re-valuate based on full service history
      if (user?.email) {
        const profiles = await base44.entities.CarProfile.filter({ created_by: user.email });
        if (profiles.length > 0) {
          const profile = profiles[0];
          const updates = { is_verified: true };
          if (data.odometer && (!profile.last_odometer || data.odometer > profile.last_odometer)) {
            updates.last_odometer = data.odometer;
            updates.last_service_date = data.service_date || profile.last_service_date;
            updates.last_service_odometer = data.odometer;
          }
          await base44.entities.CarProfile.update(profile.id, updates);

          // Fetch all logbook entries to build a service history summary for valuation
          const logEntries = await base44.entities.LogbookEntry.filter({ created_by: user.email }, '-service_date', 20);
          const serviceLines = logEntries.map(e =>
            `- ${e.service_date || 'unknown date'}: ${e.service_type || 'Service'} at ${(e.odometer || 0).toLocaleString()} km, cost $${e.cost || 0}${(e.parts_replaced || []).length ? `, parts: ${e.parts_replaced.map(p => p.part).join(', ')}` : ''}`
          ).join('\n');

          const km = updates.last_odometer || profile.last_odometer || 0;
          const revalRes = await base44.integrations.Core.InvokeLLM({
            prompt: `You are an expert Australian used car valuator.

CAR: ${profile.car_year} ${profile.car_make} ${profile.car_model}
STATE: ${profile.state || 'NSW'}
ODOMETER: ${km.toLocaleString()} km
SERVICE HISTORY (from verified receipts — use this to adjust value):
${serviceLines || 'No prior history'}

INSTRUCTIONS:
- If services are done regularly and on time (every 10,000–15,000 km or 12 months), the car holds value better — reflect this positively.
- If a major repair was done (e.g. timing belt, engine work, gearbox), note it may indicate past issues — apply a small negative adjustment.
- If routine maintenance only (oil, filters, brakes, tyres), the car is well-maintained — apply a positive adjustment vs an unknown-history car.
- Apply standard Australian depreciation for odometer vs typical 15,000 km/year for this age.
- Return realistic private sale values in AUD. No rounding to nearest 5000.`,
            add_context_from_internet: true,
            model: "gemini_3_flash",
            response_json_schema: {
              type: "object",
              properties: {
                market_price_low: { type: "number" },
                market_price_average: { type: "number" },
                market_price_high: { type: "number" }
              }
            }
          });

          if (revalRes?.market_price_average) {
            await base44.entities.CarProfile.update(profile.id, {
              last_valuation: revalRes.market_price_average,
              valuation_low: revalRes.market_price_low,
              valuation_high: revalRes.market_price_high,
              last_valuation_date: new Date().toISOString(),
            });
          }
        }
      }

      setExtracted(data);
      setStep("success");
      if (onSuccess) onSuccess(newTotal);
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      setStep("upload");
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.2 }}
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${step === "limit_reached" ? "bg-slate-300" : "bg-emerald-500"}`}>
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900">Earn 2 Free Credits</h2>
              <p className="text-xs text-slate-500 mt-0.5">Upload a receipt → earn 2 credits (twice per month)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors mt-0.5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* UPLOAD STEP */}
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-5 space-y-5"
            >
              {/* Uploads remaining this month — real cap */}
              {uploadsThisMonth != null && 2 - uploadsThisMonth > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                  <p className="text-xs font-bold text-amber-800">
                    Only {2 - uploadsThisMonth} upload{2 - uploadsThisMonth !== 1 ? "s" : ""} left this month — resets on the 1st
                  </p>
                </div>
              )}

              {/* Privacy notice */}
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-900">Privacy by Design</p>
                  <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                    We extract your service data and <strong>permanently discard the original image</strong>. Your name, address, and payment details are never stored.
                  </p>
                </div>
              </div>

              {/* What you get */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">What happens when you upload</p>
                {[
                  "Service date, odometer & cost extracted automatically",
                  "Added to your Digital Logbook",
                  "Your car's equity is updated instantly",
                  "+2 free credits per upload (up to twice per month)",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <p className="text-xs text-slate-600">{item}</p>
                  </div>
                ))}
              </div>

              {/* Upload buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => cameraRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-white hover:border-emerald-400 hover:bg-emerald-50 transition-all text-slate-600 hover:text-emerald-700"
                >
                  <Camera className="h-6 w-6" />
                  <span className="text-xs font-semibold">Take a photo</span>
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-white hover:border-emerald-400 hover:bg-emerald-50 transition-all text-slate-600 hover:text-emerald-700"
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-xs font-semibold">Upload from gallery</span>
                </button>
              </div>

              <p className="text-center text-xs text-slate-400">JPEG, PNG or PDF · Max 10MB</p>

              <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
            </motion.div>
          )}

          {/* PROCESSING STEP */}
          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 flex flex-col items-center justify-center gap-5 min-h-[280px]"
            >
              {/* Pulsing shield */}
              <div className="relative flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-emerald-100 animate-pulse" />
                <ShieldCheck className="h-10 w-10 text-emerald-600 absolute" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="font-heading font-bold text-slate-900 text-base">Securing your privacy...</p>
                <p className="text-sm text-slate-500">Extracting vehicle data and redacting personal details</p>
              </div>
              {/* Skeleton lines */}
              <div className="w-full space-y-2">
                {[70, 50, 85, 40].map((w, i) => (
                  <div key={i} className={`h-3 rounded-full bg-slate-100 animate-pulse`} style={{ width: `${w}%`, animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </motion.div>
          )}

          {/* LIMIT REACHED STEP */}
          {step === "limit_reached" && (
            <motion.div
              key="limit_reached"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 flex flex-col items-center text-center gap-4"
            >
              <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center">
                <ShieldCheck className="h-10 w-10 text-slate-400" />
              </div>
              <div>
                <p className="font-heading font-bold text-xl text-slate-900 mb-2">Monthly limit reached</p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  You've submitted the maximum of two receipts this month and earned your 4 complimentary credits. Your allowance resets on the 1st of next month.
                </p>
              </div>
              <div className="w-full rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  In the meantime, you can top up credits at any time from <strong>Settings → Billing</strong>, or earn more by referring a friend.
                </p>
              </div>
              <Button onClick={onClose} className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold">
                Got It
              </Button>
            </motion.div>
          )}

          {/* SUCCESS STEP */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 flex flex-col items-center text-center gap-4"
            >
              <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-emerald-500" />
              </div>

              <div>
                <p className="font-heading font-bold text-xl text-slate-900 mb-1">Receipt Secured! 🛡️</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your personal details have been redacted and your service history is updated.
                </p>
              </div>

              <div className="w-full rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
                <div className="flex items-center justify-center gap-2 text-emerald-700 font-heading font-bold text-lg">
                  <span>+2 Credits Added</span>
                </div>
                {extracted?.mechanic_name && (
                  <p className="text-xs text-emerald-800">
                    {extracted.mechanic_name}{extracted.service_date ? ` · ${extracted.service_date}` : ""}
                    {extracted.odometer ? ` · ${extracted.odometer.toLocaleString()} km` : ""}
                    {extracted.cost ? ` · $${extracted.cost}` : ""}
                  </p>
                )}
                {(() => {
                  const remaining = uploadsThisMonth == null ? null : 2 - uploadsThisMonth;
                  if (remaining == null) return null;
                  return remaining > 0
                    ? <p className="text-xs text-emerald-700 font-medium">You have {remaining} receipt upload{remaining !== 1 ? "s" : ""} remaining this month.</p>
                    : <p className="text-xs text-amber-700 font-medium">You've reached your monthly limit. Your allowance resets on the 1st of next month.</p>;
                })()}
              </div>

              <Button
                onClick={onClose}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold"
              >
                Return to Dashboard
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}