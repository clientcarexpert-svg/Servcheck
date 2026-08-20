import { motion } from "framer-motion";
import { Car, CheckCircle, XCircle, AlertTriangle, Wrench, ClipboardList, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import SubtleDisclaimer from "@/components/SubtleDisclaimer";
import HomescreenBonusPrompt from "@/components/HomescreenBonusPrompt";
const VERDICT_CONFIG = {
  great_deal: { label: "Great Deal", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-300", icon: ThumbsUp },
  fair: { label: "Fair Price", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-300", icon: Minus },
  high: { label: "On the High Side", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300", icon: AlertTriangle },
  overpriced: { label: "Overpriced", color: "text-red-700", bg: "bg-red-50", border: "border-red-300", icon: ThumbsDown },
};

const RECO_CONFIG = {
  buy: { label: "Buy It", bg: "bg-emerald-600", text: "text-white" },
  negotiate: { label: "Negotiate First", bg: "bg-amber-500", text: "text-white" },
  avoid: { label: "Walk Away", bg: "bg-red-600", text: "text-white" },
};

const URGENCY_COLOR = {
  immediate: "text-red-600 bg-red-50 border-red-200",
  "6_months": "text-amber-600 bg-amber-50 border-amber-200",
  "12_months": "text-blue-600 bg-blue-50 border-blue-200",
  "2_years": "text-slate-600 bg-slate-50 border-slate-200",
};

export default function BuyCarResult({ result, form, onCheckAnother }) {
  const verdictCfg = VERDICT_CONFIG[result.price_verdict] || VERDICT_CONFIG.fair;
  const recoCfg = RECO_CONFIG[result.recommendation] || RECO_CONFIG.negotiate;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

        {/* Car header */}
        <div className="rounded-2xl bg-gradient-to-br from-[#1a237e] to-[#1565c0] p-4 flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Car className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-heading font-bold text-white leading-tight">{form.car_year} {form.car_make} {form.car_model}</p>
            <p className="text-blue-200 text-xs mt-0.5 truncate">
              {parseInt(form.odometer).toLocaleString()} km · {form.suburb ? form.suburb + ", " : ""}{form.state} · ${parseInt(form.asking_price).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Recommendation banner */}
        <div className={`rounded-2xl ${recoCfg.bg} px-5 py-4 flex items-center gap-4`}>
          <div className="flex-1">
            <p className={`font-heading text-xl font-bold ${recoCfg.text}`}>{recoCfg.label}</p>
            <p className={`text-sm mt-1 leading-snug opacity-90 ${recoCfg.text}`}>{result.summary}</p>
          </div>
        </div>

        {/* Price verdict */}
        <div className={`rounded-2xl border-2 ${verdictCfg.border} ${verdictCfg.bg} p-5`}>
          <div className="flex items-center gap-2 mb-3">
            <verdictCfg.icon className={`h-5 w-5 ${verdictCfg.color}`} />
            <h3 className={`font-heading font-bold ${verdictCfg.color}`}>{verdictCfg.label}</h3>
            <span className="text-xs text-muted-foreground ml-auto">Asking ${parseInt(form.asking_price).toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[["Low", result.market_price_low], ["Average", result.market_price_average], ["High", result.market_price_high]].map(([label, val]) => (
              <div key={label} className="bg-white/60 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="font-heading text-base font-bold mt-0.5">${val?.toLocaleString()}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
            Market estimates are automated, based on publicly available data, and may not reflect your exact local market.
          </p>
        </div>

        {/* Buy score */}
        <div className="rounded-2xl border border-border bg-card px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-heading font-bold">Overall Buy Score</h3>
            <div className="flex items-end gap-0.5">
              <span className="font-heading text-3xl font-bold">{result.overall_score}</span>
              <span className="text-muted-foreground text-sm mb-0.5">/10</span>
            </div>
          </div>
          <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(result.overall_score / 10) * 100}%` }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: result.overall_score >= 7 ? "#22c55e" : result.overall_score >= 5 ? "#f59e0b" : "#ef4444" }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Score reflects price, history, mileage, known issues and upcoming costs. Not a substitute for a professional inspection.</p>
        </div>

        {/* Red / Green flags */}
        {(result.red_flags?.length > 0 || result.green_flags?.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.red_flags?.length > 0 && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <h3 className="font-heading font-bold text-red-800 text-sm">Red Flags</h3>
                </div>
                <ul className="space-y-1.5">
                  {result.red_flags.map((f, i) => <li key={i} className="text-xs text-red-700 flex gap-1.5"><span className="flex-shrink-0 mt-0.5">•</span>{f}</li>)}
                </ul>
              </div>
            )}
            {result.green_flags?.length > 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-heading font-bold text-emerald-800 text-sm">Green Flags</h3>
                </div>
                <ul className="space-y-1.5">
                  {result.green_flags.map((f, i) => <li key={i} className="text-xs text-emerald-700 flex gap-1.5"><span className="flex-shrink-0 mt-0.5">•</span>{f}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Upcoming costs */}
        {result.upcoming_costs?.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="h-4 w-4 text-slate-500" />
              <h3 className="font-heading font-bold">Upcoming Costs</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Estimated ${result.total_upcoming_low?.toLocaleString()}–${result.total_upcoming_high?.toLocaleString()} over 1–2 years. These are automated estimates — actual costs will vary.</p>
            <div className="space-y-2">
              {result.upcoming_costs.map((cost, i) => (
                <div key={i} className={`flex items-start justify-between gap-3 p-3 rounded-xl border ${URGENCY_COLOR[cost.urgency] || "bg-slate-50 border-slate-200"}`}>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{cost.item}</p>
                    <p className="text-xs opacity-70 mt-0.5">{cost.timeframe}</p>
                  </div>
                  <p className="font-heading font-bold text-sm whitespace-nowrap">${cost.estimated_cost_low?.toLocaleString()}–${cost.estimated_cost_high?.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inspection checklist */}
        {result.inspection_checklist?.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="h-4 w-4 text-blue-600" />
              <h3 className="font-heading font-bold">Before You Buy</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Model-specific inspection checklist — check these in person or with a licensed pre-purchase inspector.</p>
            <div className="space-y-2">
              {result.inspection_checklist.map((item, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-secondary/50">
                  <span className="font-bold text-blue-600 text-sm flex-shrink-0">{i + 1}.</span>
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer — quiet but accessible */}
        <SubtleDisclaimer>
          This report is generated automatically using publicly available market data and is for general guidance only.
          It does not constitute professional financial, mechanical, or legal advice. Prices and vehicle conditions vary —
          always obtain a licensed pre-purchase inspection before buying any used vehicle. ServCheck accepts no liability
          for decisions made based on this report.
        </SubtleDisclaimer>

        <HomescreenBonusPrompt />

        <div className="text-center pt-2 pb-4">
          <Button variant="outline" size="lg" onClick={onCheckAnother} className="font-heading font-semibold">
            Check another car
          </Button>
        </div>
      </motion.div>
    </div>
  );
}