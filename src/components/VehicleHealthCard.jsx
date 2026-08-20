import { useState } from "react";
import { Activity, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { getHealthScoreLabel, getHealthScoreHex, getHealthScoreColor } from "@/lib/carHealthScore";
import CarHealthScoreDetail from "@/components/CarHealthScoreDetail";

const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function VehicleHealthCard({ vehicleName, score, biggestFactor, factors }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const color = getHealthScoreHex(score);
  const textColor = getHealthScoreColor(score);
  const label = getHealthScoreLabel(score);
  const dashOffset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  const message = `Mainly because ${biggestFactor.reason} — ${biggestFactor.action}.`;

  return (
    <>
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setDetailOpen(true)}
        className="w-full text-left rounded-2xl bg-white p-5 border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="6" />
              <circle
                cx="40" cy="40" r={RADIUS}
                fill="none"
                stroke={color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 40 40)"
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
              <text
                x="40" y="44"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="18"
                fontWeight="800"
                fill={color}
                fontFamily="Inter, sans-serif"
              >
                {Math.round(score)}
              </text>
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Activity className={`h-4 w-4 flex-shrink-0 ${textColor}`} />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 truncate">{vehicleName}</p>
            </div>
            <p className={`text-base font-extrabold ${textColor} leading-tight`}>{label}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">{message}</p>
            <p className="text-[10px] text-slate-400 mt-1">Maintenance tracking indicator only — not an assessment of vehicle condition.</p>
            <p className="text-[11px] font-semibold text-slate-400 mt-1 flex items-center gap-0.5">
              Tap for full breakdown <ChevronRight className="h-3 w-3" />
            </p>
          </div>
        </div>
      </motion.button>

      <CarHealthScoreDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        score={score}
        factors={factors}
      />
    </>
  );
}