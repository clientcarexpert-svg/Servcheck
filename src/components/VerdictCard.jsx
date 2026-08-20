import { CheckCircle, AlertTriangle, XOctagon, ShieldAlert, Star, Info } from "lucide-react";
import { motion } from "framer-motion";

// ─── Tier configs ───────────────────────────────────────────────
const GREAT_DEAL_CONFIG = {
  icon: Star,
  label: "Great Deal",
  sublabel: "Below typical market rate — good value",
  bg: "bg-emerald-50",
  border: "border-emerald-300",
  iconColor: "text-emerald-600",
  textColor: "text-emerald-800",
  badgeBg: "bg-emerald-600",
};

const FAIR_CONFIG = {
  icon: CheckCircle,
  label: "Fair Price",
  sublabel: "This quote looks reasonable for your area",
  bg: "bg-emerald-50",
  border: "border-emerald-200",
  iconColor: "text-emerald-600",
  textColor: "text-emerald-800",
  badgeBg: "bg-emerald-600",
};

const MARKET_RATE_CONFIG = {
  icon: AlertTriangle,
  label: "Market Rate",
  sublabel: "Above average — you may be able to negotiate",
  bg: "bg-yellow-50",
  border: "border-yellow-300",
  iconColor: "text-yellow-600",
  textColor: "text-yellow-800",
  badgeBg: "bg-yellow-500",
};

const HIGH_CONFIG = {
  icon: AlertTriangle,
  label: "Above Market Rate",
  sublabel: "Over 10% above the high end — push back on this",
  bg: "bg-orange-50",
  border: "border-orange-300",
  iconColor: "text-orange-600",
  textColor: "text-orange-800",
  badgeBg: "bg-orange-500",
};

const RIPOFF_CONFIG = {
  icon: XOctagon,
  label: "Significantly Overpriced",
  sublabel: "Over 25% above the high end — consider getting a second opinion",
  bg: "bg-red-50",
  border: "border-red-300",
  iconColor: "text-red-600",
  textColor: "text-red-800",
  badgeBg: "bg-red-600",
};

const SUSPICIOUS_CONFIG = {
  icon: ShieldAlert,
  label: "Suspiciously Cheap",
  sublabel: "15%+ below market low — bait & switch or low-grade parts risk",
  bg: "bg-orange-50",
  border: "border-orange-400",
  iconColor: "text-orange-600",
  textColor: "text-orange-800",
  badgeBg: "bg-orange-500",
};

// Determine config + exact percentage label
function getAnalysis(data) {
  const q = data.quoted_price;
  const low = data.price_low;
  const avg = data.price_average;
  const high = data.price_high;

  if (!q || !low || !avg || !high) {
    return { config: FAIR_CONFIG, pctLabel: null };
  }

  const pctBelowLow = (low - q) / low;
  const pctAboveHigh = (q - high) / high;
  const pctAboveAvg = (q - avg) / avg;

  if (pctBelowLow >= 0.15) {
    const pct = Math.round(pctBelowLow * 100);
    return { config: SUSPICIOUS_CONFIG, pctLabel: `${pct}% below market low` };
  }
  if (pctBelowLow > 0) {
    const pct = Math.round(pctBelowLow * 100);
    return { config: GREAT_DEAL_CONFIG, pctLabel: `${pct}% below market low` };
  }
  if (q <= avg) {
    const pct = Math.round(((avg - q) / avg) * 100);
    return { config: FAIR_CONFIG, pctLabel: pct > 0 ? `${pct}% below average` : null };
  }
  // Above average — check both avg and high thresholds, take the worse tier
  if (pctAboveAvg >= 0.25 || pctAboveHigh >= 0.25) {
    const pct = Math.round(Math.max(pctAboveAvg, pctAboveHigh) * 100);
    const base = pctAboveAvg >= pctAboveHigh ? 'average' : 'market high';
    return { config: RIPOFF_CONFIG, pctLabel: `${Math.round(pctAboveAvg * 100)}% above average / ${Math.round(Math.max(0, pctAboveHigh) * 100)}% above market high` };
  }
  if (q <= high) {
    const pct = Math.round(pctAboveAvg * 100);
    return { config: MARKET_RATE_CONFIG, pctLabel: `${pct}% above average` };
  }
  const pct = Math.round(pctAboveHigh * 100);
  return { config: HIGH_CONFIG, pctLabel: `${pct}% above market high` };
}

export default function VerdictCard({ data }) {
  const { config, pctLabel } = getAnalysis(data);
  const isSuspicious = config === SUSPICIOUS_CONFIG;
  const Icon = config.icon;
  const overcharge = data.quoted_price > data.price_average ? data.quoted_price - data.price_average : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`rounded-2xl border-2 ${config.border} ${config.bg} p-6 sm:p-8`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`h-14 w-14 rounded-2xl ${config.badgeBg} flex items-center justify-center flex-shrink-0`}
        >
          <Icon className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2
            className={`font-heading text-2xl sm:text-3xl font-bold ${config.textColor}`}
          >
            {config.label}
          </h2>
          <p className={`text-sm mt-1 ${config.textColor} opacity-80`}>
            {config.sublabel}
          </p>
          {pctLabel && (
            <p className={`text-xs mt-1 font-bold ${config.textColor}`}>
              ({pctLabel})
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="bg-white/60 rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Low
          </p>
          <p className="font-heading text-xl font-bold mt-1">
            ${data.price_low?.toLocaleString()}
          </p>
        </div>
        <div className="bg-white/60 rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Average
          </p>
          <p className="font-heading text-xl font-bold mt-1">
            ${data.price_average?.toLocaleString()}
          </p>
        </div>
        <div className="bg-white/60 rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            High
          </p>
          <p className="font-heading text-xl font-bold mt-1">
            ${data.price_high?.toLocaleString()}
          </p>
        </div>
      </div>

      {overcharge > 0 && (
        <div className="mt-4 bg-white/60 rounded-xl p-4 text-center">
          <p className={`font-heading text-lg font-bold ${config.textColor}`}>
            You're being charged ${overcharge.toLocaleString()} more than average
          </p>
        </div>
      )}

      {/* High-variance caveat */}
      {data.high_variance_caveat && (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800 leading-relaxed">{data.high_variance_caveat}</p>
        </div>
      )}

      {isSuspicious && (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-orange-100 border border-orange-300 px-4 py-3">
          <ShieldAlert className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-orange-800 leading-relaxed">Quotes this far below market rate often indicate non-OEM parts, skipped steps, or a bait-and-switch. Ask for a parts brand guarantee in writing before proceeding.</p>
        </div>
      )}

      <div className="mt-6">
        <div className="relative h-3 bg-white/80 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-emerald-400 rounded-full"
            style={{
              width: `${Math.min(((data.price_low || 0) / (data.price_high || 1)) * 100, 100)}%`,
            }}
          />
          <div
            className="absolute top-0 h-full bg-amber-400 rounded-full"
            style={{
              left: `${((data.price_low || 0) / (data.price_high || 1)) * 100}%`,
              width: `${((data.price_average - data.price_low) / (data.price_high || 1)) * 100}%`,
            }}
          />
          <div
            className="absolute top-0 h-full w-1 bg-foreground rounded-full -translate-x-1/2"
            style={{
              left: `${Math.min(((data.quoted_price || 0) / ((data.price_high || 1) * 1.2)) * 100, 100)}%`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-muted-foreground">Low</span>
          <span className="text-xs font-semibold">
            Your quote: ${data.quoted_price?.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">High</span>
        </div>
      </div>

      {/* Data source note */}
      <p className="mt-4 text-[11px] text-slate-400 text-center italic">
        Based on current Australian market pricing from verified automotive service providers across your state. Updated in real time.
      </p>

      {/* ACCC Compliance Disclaimer */}
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-white/70 border border-slate-200 px-4 py-3">
        <Info className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          <strong className="text-slate-600">Estimate only.</strong> This result is based on independent pricing analysis using aggregated Australian market data and is not a definitive mechanical assessment. Prices vary based on your vehicle's specific condition, parts availability, and location. Always obtain a written quote from a licensed mechanic before authorising any work.
        </p>
      </div>
    </motion.div>
  );
}