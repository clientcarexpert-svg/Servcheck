import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TIPS = [
  "Checking current market listings across Australia…",
  "Calculating fair market value for this make and model…",
  "Reviewing typical km-based depreciation…",
  "Assessing upcoming service costs by odometer…",
  "Cross-referencing similar cars sold recently…",
  "Analysing service history impact on value…",
  "Flagging model-specific known issues…",
  "Checking rego status and transfer costs…",
  "Compiling your full buyer's report…",
];

const STEPS = [
  { label: "Market research", duration: 3000 },
  { label: "Valuation", duration: 3000 },
  { label: "Cost forecast", duration: 3500 },
  { label: "Final report", duration: null },
];

export default function CarAnalysisLoader({ make, model, year }) {
  const [tipIndex, setTipIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex(i => (i + 1) % TIPS.length);
    }, 2800);

    let stepTimeout;
    const advanceStep = (idx) => {
      if (idx < STEPS.length - 1 && STEPS[idx].duration) {
        stepTimeout = setTimeout(() => {
          setStepIndex(idx + 1);
          advanceStep(idx + 1);
        }, STEPS[idx].duration);
      }
    };
    advanceStep(0);

    return () => {
      clearInterval(tipInterval);
      clearTimeout(stepTimeout);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-8"
    >
      {/* Professional loading spinner */}
      <div className="relative h-20 w-20 flex items-center justify-center">
        <motion.div
          className="absolute h-20 w-20 rounded-full border-4 border-secondary"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
        />
        <motion.div
          className="absolute h-16 w-16 rounded-full border-4 border-transparent border-t-accent border-r-accent"
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
        />
        <div className="absolute h-3 w-3 rounded-full bg-accent" />
      </div>

      {/* Headline */}
      <div>
        <h2 className="font-heading font-bold text-2xl mb-2">Analysing Your Car</h2>
        <p className="text-muted-foreground text-sm">{year} {make} {model}</p>
      </div>

      {/* Rotating tip */}
      <div className="h-10 flex items-center justify-center w-full max-w-sm">
        <AnimatePresence mode="wait">
          <motion.p
            key={tipIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="text-sm text-muted-foreground italic"
          >
            {TIPS[tipIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Step progress */}
      <div className="w-full max-w-xs space-y-2">
        {STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center gap-3">
            <div className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
              i < stepIndex
                ? "bg-emerald-500"
                : i === stepIndex
                ? "bg-accent animate-pulse"
                : "bg-secondary"
            }`}>
              {i < stepIndex ? (
                <span className="text-white text-xs">✓</span>
              ) : (
                <span className="text-xs font-bold text-white/60">{i + 1}</span>
              )}
            </div>
            <div className={`h-1.5 flex-1 rounded-full overflow-hidden bg-secondary`}>
              <motion.div
                className="h-full bg-accent rounded-full"
                initial={{ width: "0%" }}
                animate={{
                  width: i < stepIndex ? "100%" : i === stepIndex ? "60%" : "0%",
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <span className={`text-xs font-medium w-24 text-left ${i === stepIndex ? "text-foreground" : "text-muted-foreground"}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground max-w-xs">
        We're running live market research — this usually takes 15–25 seconds.
      </p>
    </motion.div>
  );
}