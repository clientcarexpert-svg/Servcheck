import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import HomescreenBonusPrompt from "@/components/HomescreenBonusPrompt";

const SEVERITY_COLORS = {
  Low: "bg-emerald-100 text-emerald-800",
  Moderate: "bg-amber-100 text-amber-800",
  Urgent: "bg-red-100 text-red-800",
};

export default function DiagnosisResult({ diagnosis, carDetails, onReset }) {
  return (
    <div className="max-w-lg mx-auto px-4 pb-12 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Symptom Report</p>
        <h2 className="font-heading font-black text-2xl text-[#0B1120]">
          {carDetails.car_year} {carDetails.car_make} {carDetails.car_model}
        </h2>
      </motion.div>

      {/* Cost estimate */}
      {(diagnosis.repair_cost_low || diagnosis.repair_cost_high) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Typical Repair Cost Range</p>
          <p className="font-heading font-black text-3xl text-[#0B1120]">
            ${diagnosis.repair_cost_low?.toLocaleString()} – ${diagnosis.repair_cost_high?.toLocaleString()}
            <span className="text-base font-semibold text-slate-400 ml-1">AUD</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Based on typical Australian labour and parts costs for the most likely faults above. The actual cost depends on which fault is confirmed by a qualified mechanic.</p>
        </motion.div>
      )}

      {/* Ranked causes */}
      {diagnosis.ranked_causes?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="px-4 pt-4 pb-2 border-b border-slate-100">
            <p className="font-heading font-bold text-base text-[#0B1120]">Ranked Likely Causes</p>
            <p className="text-xs text-slate-500 mt-0.5">Ordered by likelihood based on your reported symptoms</p>
          </div>
          <div className="divide-y divide-slate-100">
            {diagnosis.ranked_causes.map((cause, i) => (
              <div key={i} className="px-4 py-3.5 flex items-start gap-3">
                <div className="flex-shrink-0 h-7 w-7 rounded-full bg-[#0B1120] text-white text-xs font-extrabold flex items-center justify-center mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-[#0B1120]">{cause.cause}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${SEVERITY_COLORS[cause.severity] || "bg-slate-100 text-slate-700"}`}>
                      {cause.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">{cause.explanation}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs font-bold text-slate-400">Likelihood</p>
                  <p className="font-heading font-black text-base text-[#f97316]">{cause.likelihood}/10</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Assessment */}
      {diagnosis.ai_assessment && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl bg-[#0B1120] p-5 shadow-sm"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Symptom Assessment</p>
          <p className="text-sm text-slate-200 font-medium leading-relaxed">{diagnosis.ai_assessment}</p>
          {diagnosis.general_guidance && (
            <p className="text-sm text-[#f97316] font-semibold mt-3 pt-3 border-t border-white/10 leading-snug">{diagnosis.general_guidance}</p>
          )}
        </motion.div>
      )}

      {/* Questions to ask mechanic */}
      {diagnosis.mechanic_questions?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4"
        >
          <p className="font-heading font-bold text-base text-[#0B1120] mb-3">Questions to Ask Your Mechanic</p>
          <ul className="space-y-2">
            {diagnosis.mechanic_questions.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span className="font-medium leading-snug">{q}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl bg-[#f97316] p-5 text-white shadow-lg shadow-orange-500/20"
      >
        <p className="font-heading font-black text-lg mb-1">Got a quote from a mechanic?</p>
        <p className="text-sm text-orange-100 mb-4">Check if the price is within the typical range before you pay.</p>
        <Link to="/check-quote">
          <Button className="w-full bg-white text-[#f97316] hover:bg-orange-50 font-bold h-11 rounded-xl flex items-center gap-2">
            Check the Quote <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </motion.div>

      <HomescreenBonusPrompt />

      {/* Disclaimer */}
      <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
        <p className="text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Important Disclaimer</p>
        <p className="text-xs text-slate-500 leading-relaxed">
          This report is generated from the symptoms you described and provides general information only. It is not a professional mechanical inspection or diagnosis, and it does not determine whether your vehicle is safe to drive. The possible causes and cost ranges listed are estimates based on common symptom patterns for vehicles like yours and do not account for the actual condition of your vehicle. Only a qualified mechanic who has physically inspected your vehicle can determine the true cause and cost of any fault. Do not make repair decisions based on this report alone.
        </p>
      </div>

      <button
        onClick={onReset}
        className="w-full text-center text-sm font-semibold text-slate-500 hover:text-slate-800 underline"
      >
        Start a new report
      </button>
    </div>
  );
}