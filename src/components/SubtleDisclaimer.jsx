import { useState } from "react";
import { Info, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Quiet, expandable disclaimer — low visual weight but always accessible.
export default function SubtleDisclaimer({ label = "Estimate only — tap for important information", children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="pt-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-1.5 text-left text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
      >
        <Info className="h-3 w-3 flex-shrink-0" />
        <span className="flex-1">{label}</span>
        <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="text-[11px] text-slate-500 leading-relaxed pt-2 pl-[18px]">
              {children}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}