import { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import SymptomWizard from "@/components/SymptomChecker/SymptomWizard";
import DiagnosisResult from "@/components/SymptomChecker/DiagnosisResult";
import { deductCredit, refundCredit, CREDITS_PER_CHECK } from "@/lib/credits";

export default function SymptomChecker() {
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [carDetails, setCarDetails] = useState(null);

  const handleSubmit = async ({ carDetails: car, symptomsSelected, symptomAnswers, finalDetails }) => {
    setLoading(true);
    setCarDetails(car);

    const credited = await deductCredit();
    if (!credited) {
      toast.error("Not enough credits. Top up to run a symptom report.");
      setLoading(false);
      return;
    }

    try {
      const res = await base44.functions.invoke("diagnoseCarSymptoms", {
        carDetails: car,
        symptomsSelected,
        symptomAnswers,
        finalDetails,
      });
      if (res.data?.success) {
        setDiagnosis(res.data.diagnosis);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        await refundCredit();
        toast.error(res.data?.error || "Failed to generate report. Please try again.");
      }
    } catch (err) {
      await refundCredit();
      toast.error(err?.response?.data?.error || err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: "#0B1120" }}>
        <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="honeycomb-sx" x="0" y="0" width="56" height="50" patternUnits="userSpaceOnUse">
              <polygon points="14,2 42,2 56,25 42,48 14,48 0,25" fill="none" stroke="white" strokeWidth="1.5"/>
              <polygon points="42,27 70,27 84,50 70,73 42,73 28,50" fill="none" stroke="white" strokeWidth="1.5"/>
              <polygon points="-14,27 14,27 28,50 14,73 -14,73 -28,50" fill="none" stroke="white" strokeWidth="1.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#honeycomb-sx)"/>
        </svg>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%)" }} />

        <div className="max-w-lg mx-auto px-5 pt-10 pb-10 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-xs font-bold text-white/80 uppercase tracking-wider mb-5 backdrop-blur-sm">
            {CREDITS_PER_CHECK} Credits per Report
          </div>
          {!diagnosis ? (
            <>
              <h1 className="font-heading text-4xl font-black leading-[1.1] mb-3 text-white">
                What's wrong with <span className="text-[#f97316]">your car?</span>
              </h1>
              <p className="text-base text-slate-300 leading-relaxed max-w-sm">
                Answer a few guided questions. Get ranked likely causes, a severity rating, and typical Australian repair cost ranges based on your symptoms.
              </p>
              <div className="flex flex-wrap gap-3 mt-5">
                {["Instant report", "AUD cost ranges", "5 credits"].map(t => (
                  <span key={t} className="text-xs font-semibold text-white/70 bg-white/10 px-3 py-1.5 rounded-full">{t}</span>
                ))}
              </div>
            </>
          ) : (
            <div>
              <h1 className="font-heading text-2xl font-black text-white">Fault Report Complete</h1>
              <p className="text-sm text-slate-400 mt-1">Based on your reported symptoms — read disclaimer below</p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        {!diagnosis ? (
          <SymptomWizard onSubmit={handleSubmit} loading={loading} />
        ) : (
          <DiagnosisResult
            diagnosis={diagnosis}
            carDetails={carDetails}
            onReset={() => { setDiagnosis(null); setCarDetails(null); }}
          />
        )}
      </div>

      {/* Disclaimer */}
      <div className="max-w-lg mx-auto px-5 pb-10">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Disclaimer</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            The symptom analysis provided by ServCheck is for informational purposes only and does not constitute professional mechanical advice or a determination that your vehicle is safe to drive. Results are estimates based on common symptom patterns for vehicles like yours and may not reflect the exact cause or condition of your specific vehicle. Always consult a qualified mechanic before making any repair or safety decisions. Except where liability cannot be excluded under the Australian Consumer Law, ServCheck accepts no liability for any loss, damage, or injury arising from reliance on this report.
          </p>
        </div>
      </div>
    </div>
  );
}