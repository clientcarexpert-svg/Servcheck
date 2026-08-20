import { TrendingDown, TrendingUp, Minus, Info, CheckCircle2, AlertTriangle, XOctagon } from "lucide-react";

const VERDICT_CONFIG = {
  ripoff: { label: "Overpriced", cls: "bg-red-100 text-red-700 border-red-200", Icon: XOctagon },
  high: { label: "Above market", cls: "bg-orange-100 text-orange-700 border-orange-200", Icon: AlertTriangle },
  fair: { label: "Fair", cls: "bg-emerald-100 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
  great_deal: { label: "Great deal", cls: "bg-blue-100 text-blue-700 border-blue-200", Icon: CheckCircle2 },
  too_cheap: { label: "Suspiciously cheap", cls: "bg-orange-100 text-orange-700 border-orange-200", Icon: AlertTriangle },
};

export default function FairPricePanel({ lead }) {
  const low = lead.app_fair_price_low;
  const high = lead.app_fair_price_high;
  const avg = lead.app_fair_price_average;
  const quotedPrice = lead.quoted_price;
  const verdict = lead.app_verdict || lead.verdict;

  if (!low && !high && !avg) return null;

  const hasRange = low && high;
  const rangeWidth = hasRange ? high - low : 0;
  const verdictCfg = VERDICT_CONFIG[verdict] || null;
  const VerdictIcon = verdictCfg?.Icon;

  return (
    <div className="rounded-2xl border-2 border-[#1a237e]/20 bg-gradient-to-br from-[#1a237e]/5 to-blue-50 overflow-hidden">
      {/* Header */}
      <div className="bg-[#1a237e] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center">
            <Info className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-white">ServCheck Fair Price</span>
        </div>
        {verdictCfg && (
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${verdictCfg.cls}`}>
            <VerdictIcon className="h-3 w-3" />
            {verdictCfg.label}
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Price columns */}
        {hasRange && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-center p-3">
                <p className="text-[10px] font-bold uppercase text-emerald-700 mb-0.5 flex items-center justify-center gap-0.5">
                  <TrendingDown className="h-3 w-3" /> Low
                </p>
                <p className="font-heading font-black text-emerald-800 text-lg">${low?.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-[#1a237e] text-center p-3">
                <p className="text-[10px] font-bold uppercase text-blue-200 mb-0.5 flex items-center justify-center gap-0.5">
                  <Minus className="h-3 w-3" /> Avg
                </p>
                <p className="font-heading font-black text-white text-lg">${avg?.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-slate-100 border border-slate-200 text-center p-3">
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-0.5 flex items-center justify-center gap-0.5">
                  High <TrendingUp className="h-3 w-3" />
                </p>
                <p className="font-heading font-black text-slate-700 text-lg">${high?.toLocaleString()}</p>
              </div>
            </div>

            {/* Range bar */}
            <div>
              <div className="relative h-3 bg-white rounded-full overflow-hidden border border-slate-200">
                <div className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                  style={{ left: "10%", right: "10%" }} />
                {avg && (
                  <div className="absolute top-0 bottom-0 w-1 bg-[#1a237e] rounded-full"
                    style={{ left: `${rangeWidth > 0 ? 10 + ((avg - low) / rangeWidth) * 80 : 50}%` }} />
                )}
                {quotedPrice && quotedPrice > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-1.5 bg-red-500 rounded-full"
                    style={{ left: `${Math.min(Math.max(((quotedPrice - low) / (rangeWidth * 1.2)) * 80 + 10, 2), 98)}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-1">
                <span>Low</span>
                {quotedPrice > 0 && (
                  <span className="text-red-500 font-bold">Their quote: ${quotedPrice?.toLocaleString()}</span>
                )}
                <span>High</span>
              </div>
            </div>
          </>
        )}

        {/* Call to action for mechanics */}
        <div className="rounded-xl bg-white border border-[#1a237e]/20 px-3 py-2.5 flex items-start gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#1a237e] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong className="text-[#1a237e]">Can you beat this?</strong> If you can do this service within the fair price range above, let the customer know when you respond.
          </p>
        </div>
      </div>
    </div>
  );
}