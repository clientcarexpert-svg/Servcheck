import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles } from "lucide-react";

const SPARKS = [
  { x: -46, y: -34, d: 0 }, { x: 46, y: -34, d: 0.05 },
  { x: -26, y: -56, d: 0.1 }, { x: 26, y: -56, d: 0.15 },
  { x: 0, y: -66, d: 0.08 }, { x: -60, y: -8, d: 0.18 },
  { x: 60, y: -8, d: 0.12 },
];

export default function GiftBoxReveal({ amount = 5, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center py-2 text-center">
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button
            key="closed"
            onClick={() => setOpen(true)}
            exit={{ scale: 0.6, opacity: 0 }}
            animate={{ y: [0, -5, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            whileTap={{ scale: 0.9 }}
            className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/70 shadow-lg shadow-accent/30"
          >
            <span className="absolute inset-y-0 left-1/2 w-3 -translate-x-1/2 bg-white/40" />
            <span className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 bg-white/40" />
            <Gift className="relative h-10 w-10 text-white drop-shadow" />
          </motion.button>
        ) : (
          <motion.div key="opened" className="relative">
            {SPARKS.map((s, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                animate={{ opacity: [0, 1, 0], x: s.x, y: s.y, scale: 1.1 }}
                transition={{ duration: 1, delay: s.d }}
                className="absolute left-1/2 top-1/2 text-accent"
              >
                <Sparkles className="h-4 w-4" />
              </motion.span>
            ))}
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
              className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-accent/15 ring-4 ring-accent/30"
            >
              <span className="font-heading text-3xl font-black leading-none text-accent">+{amount}</span>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">credits</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!open ? (
        <p className="mt-3 text-xs font-bold text-foreground">Tap to open your gift 🎁</p>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-3"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}