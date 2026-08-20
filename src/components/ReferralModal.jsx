import { X } from "lucide-react";
import { motion } from "framer-motion";
import ReferralSection from "./ReferralSection";

export default function ReferralModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-lg text-slate-900">Refer a Friend</h2>
            <p className="text-xs text-slate-500 mt-0.5">You both get 5 free credits when they sign up</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors ml-4">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <ReferralSection onCreditsUpdated={() => { window.dispatchEvent(new Event("credits-updated")); }} />
        </div>
      </motion.div>
    </div>
  );
}