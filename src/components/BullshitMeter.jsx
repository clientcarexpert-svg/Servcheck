import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";

export default function BullshitMeter({ score, reasoning }) {
  if (!score && score !== 0) return null;

  const getConfig = (s) => {
    if (s <= 3) return { 
      icon: CheckCircle2, label: "Fair Range",
      text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200",
      badgeBg: "bg-emerald-100", badgeText: "text-emerald-700", barColor: "#10b981",
      glowColor: "shadow-emerald-200"
    };
    if (s <= 6) return { 
      icon: AlertTriangle, label: "Above Average",
      text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200",
      badgeBg: "bg-amber-100", badgeText: "text-amber-700", barColor: "#f59e0b",
      glowColor: "shadow-amber-200"
    };
    return { 
      icon: AlertCircle, label: "Well Above Market",
      text: "text-red-700", bg: "bg-red-50", border: "border-red-200",
      badgeBg: "bg-red-100", badgeText: "text-red-700", barColor: "#ef4444",
      glowColor: "shadow-red-200"
    };
  };

  const config = getConfig(score);
  const Icon = config.icon;
  const pct = (score / 10) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className={`rounded-2xl border ${config.border} ${config.bg} overflow-hidden`}
    >
      {/* Header */}
      <div className="px-5 pt-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
            <TrendingUp className={`h-4 w-4 ${config.text}`} />
          </div>
          <p className="font-heading font-bold text-sm text-[#0B1120]">Market Variance</p>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${config.badgeBg} ${config.badgeText}`}>
          {config.label}
        </span>
      </div>

      {/* Score + Bar */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-end gap-3 mb-4">
          <span className={`font-heading text-5xl font-black leading-none ${config.text}`}>{score}</span>
          <span className="text-sm font-semibold text-slate-400 pb-1">/10</span>
        </div>

        {/* Segmented bar */}
        <div className="flex gap-1 h-3 mb-2">
          {Array.from({ length: 10 }, (_, i) => {
            const filled = i < score;
            const segColor = i < 3 ? "#10b981" : i < 6 ? "#f59e0b" : "#ef4444";
            return (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.4 + i * 0.05, duration: 0.2 }}
                className="flex-1 rounded-full origin-bottom"
                style={{ backgroundColor: filled ? segColor : "rgba(255,255,255,0.5)" }}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] font-semibold">
          <span className="text-emerald-600">Fair</span>
          <span className="text-amber-600">Moderate</span>
          <span className="text-red-600">High</span>
        </div>
      </div>

      {/* Reasoning */}
      {reasoning && (
        <div className="mx-5 mb-5 bg-white/60 rounded-xl p-3.5 border border-white/80">
          <div className="flex items-start gap-2.5">
            <Icon className={`h-4 w-4 ${config.text} flex-shrink-0 mt-0.5`} />
            <p className="text-xs leading-relaxed text-slate-700">{reasoning}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}