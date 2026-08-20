import { motion } from "framer-motion";
import { Lock, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Shown as an overlay when a guest tries to submit the quote form.
 * Blurs the background and prompts login/signup.
 */
export default function GuestGate({ onClose }) {
  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05, type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-sm mx-4 mb-6 sm:mb-0 bg-white rounded-3xl shadow-2xl p-7 z-10"
      >
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="h-16 w-16 rounded-2xl bg-[#f97316] flex items-center justify-center shadow-lg shadow-orange-200">
            <Lock className="h-8 w-8 text-white" />
          </div>
        </div>

        <h2 className="font-heading font-black text-2xl text-[#1a237e] text-center mb-2 leading-tight">
          Unlock Your Results
        </h2>
        <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
          Create a free account to see your full quote analysis — verdict, fair price range, counter-offer and more.
        </p>

        {/* Blurred preview of results */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 mb-6 relative overflow-hidden">
          <div className="blur-sm select-none pointer-events-none space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verdict</span>
              <span className="text-base font-heading font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">FAIR</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fair Range</span>
              <span className="text-sm font-bold text-slate-700">$XXX – $XXX</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Counter Offer</span>
              <span className="text-sm font-bold text-[#f97316]">$XXX</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">BS Meter</span>
              <span className="text-sm font-bold text-slate-700">X / 10</span>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/80 rounded-xl px-4 py-2 flex items-center gap-2 shadow">
              <Lock className="h-3.5 w-3.5 text-[#1a237e]" />
              <span className="text-xs font-bold text-[#1a237e]">Sign up to reveal</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogin}
          className="w-full h-13 py-3.5 rounded-2xl bg-[#f97316] hover:bg-[#ea6c0a] text-white font-heading font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-200 transition-colors"
        >
          <Zap className="h-5 w-5" /> Sign up free / Log in
        </button>

        <p className="text-center text-xs text-slate-400 mt-3">
          Free account includes 5 credits — no card required.
        </p>
      </motion.div>
    </motion.div>
  );
}