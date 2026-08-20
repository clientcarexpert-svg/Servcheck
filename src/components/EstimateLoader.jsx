import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Database, BarChart2, CheckCircle } from "lucide-react";

const STEPS = [
  { icon: Search, label: "Searching market prices...", color: "text-blue-500" },
  { icon: Database, label: "Checking parts & labour data...", color: "text-violet-500" },
  { icon: BarChart2, label: "Comparing labour rates...", color: "text-orange-500" },
  { icon: CheckCircle, label: "Finalising your estimate...", color: "text-emerald-500" },
];

export default function EstimateLoader() {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(4);

  useEffect(() => {
    // Advance steps every 2.5s
    const stepTimer = setInterval(() => {
      setStepIndex(i => Math.min(i + 1, STEPS.length - 1));
    }, 2500);

    // Smoothly fill progress bar over ~12s, stopping at 92%
    const progTimer = setInterval(() => {
      setProgress(p => {
        if (p >= 92) return p;
        const increment = p < 60 ? 2.5 : p < 80 ? 1 : 0.4;
        return Math.min(p + increment, 92);
      });
    }, 250);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progTimer);
    };
  }, []);

  const CurrentIcon = STEPS[stepIndex].icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      {/* Animated icon */}
      <div className="relative mb-8">
        <div className="h-20 w-20 rounded-2xl bg-[#0A0F2C] flex items-center justify-center shadow-xl shadow-blue-900/30">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentIcon className={`h-8 w-8 ${STEPS[stepIndex].color}`} />
            </motion.div>
          </AnimatePresence>
        </div>
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/30 animate-ping" />
      </div>

      {/* Title */}
      <p className="font-heading font-black text-xl text-[#0A0F2C] mb-1 text-center">
        Analysing Market Prices
      </p>
      <p className="text-sm text-slate-500 mb-8 text-center">
        We're crunching real Australian pricing data for you
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-sm mb-4">
        <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#1a237e] to-[#f97316]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Step messages */}
      <div className="w-full max-w-sm space-y-2 mt-4">
        {STEPS.map((step, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          const Icon = step.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: i <= stepIndex ? 1 : 0.3, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                active ? "bg-slate-100 border border-slate-200" : ""
              }`}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 ${done ? "text-emerald-500" : active ? step.color : "text-slate-300"}`} />
              <span className={`text-sm font-medium ${done ? "text-emerald-600 line-through" : active ? "text-slate-800" : "text-slate-400"}`}>
                {step.label}
              </span>
              {active && (
                <div className="ml-auto w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin flex-shrink-0" />
              )}
              {done && (
                <CheckCircle className="ml-auto h-4 w-4 text-emerald-500 flex-shrink-0" />
              )}
            </motion.div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-400 mt-8 text-center">
        Usually takes 10–20 seconds — hang tight!
      </p>
    </div>
  );
}