import { useState, useRef } from "react";
import { X, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFocusTrap, useFocusRestore } from "@/hooks/useKeyboardNavigation";
import { MOTION_CONFIG, ANIMATION_VARIANTS, useReducedMotion } from "@/lib/motionConfig";
import QuoteForm from "./QuoteForm";

const STEPS = ["Your Ride", "Engine & Variant", "Services", "The Quote"];

function getUrlPrefill() {
  try {
    const raw = new URLSearchParams(window.location.search).get("prefill");
    return raw ? JSON.parse(decodeURIComponent(raw)) : null;
  } catch { return null; }
}

export default function CheckQuoteModal({ onClose }) {
  const [prefillData, setPrefillData] = useState(() => getUrlPrefill());
  const [currentStep, setCurrentStep] = useState(0);
  const modalRef = useRef(null);
  const prefersReduced = useReducedMotion();
  useFocusTrap(modalRef, true);
  useFocusRestore(true);

  return (
    <AnimatePresence>
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-labelledby="quote-modal-title"
        initial={ANIMATION_VARIANTS.fadeIn.hidden}
        animate={ANIMATION_VARIANTS.fadeIn.visible}
        exit={ANIMATION_VARIANTS.fadeIn.hidden}
        transition={MOTION_CONFIG.quick}
        onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
        className="fixed inset-0 z-50 bg-white flex flex-col"
      >
        {/* ── Premium Header ── */}
        <div className="flex-shrink-0 bg-white border-b border-slate-100">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#1a237e] flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-heading font-black text-[#1a237e] text-base tracking-tight">ServCheck</span>
            </div>

            {/* Step label */}
             <div className="text-center">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                 Step {currentStep + 1} of {STEPS.length}
               </p>
               <p id="quote-modal-title" className="text-sm font-bold text-slate-800 leading-tight">{STEPS[currentStep]}</p>
             </div>

            {/* Close */}
               <button
                 onClick={onClose}
                 onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
                 aria-label="Close quote form"
                 className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-95 transition-all focus:ring-2 focus:ring-accent focus:outline-none"
               >
                 <X className="h-4 w-4" />
               </button>
          </div>

          {/* Step progress segments */}
          <div className="flex items-center gap-1.5 px-5 pb-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={i}
                className="rounded-full"
                animate={{ flex: i === currentStep ? 3 : 1 }}
                transition={MOTION_CONFIG.normal}
                style={{
                  height: 3,
                  background: i < currentStep ? '#1a237e' : i === currentStep ? '#f97316' : '#e2e8f0',
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Scrollable form ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-6 pb-28 max-w-xl mx-auto w-full">
            <QuoteForm
              prefillData={prefillData}
              onSetPrefill={setPrefillData}
              onStepChange={setCurrentStep}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}