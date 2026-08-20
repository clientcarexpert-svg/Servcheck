import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendingUp, TrendingDown } from "lucide-react";
import { getHealthScoreLabel, getHealthScoreHex, getHealthScoreColor } from "@/lib/carHealthScore";

export default function CarHealthScoreDetail({ open, onOpenChange, score, factors }) {
  // Safety net: ensure the page is interactive again after the dialog closes
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => { document.body.style.pointerEvents = ""; }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  const color = getHealthScoreHex(score);
  const textColor = getHealthScoreColor(score);
  const positives = factors.filter(f => f.value > 0);
  const negatives = factors.filter(f => f.value < 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading font-black text-xl text-[#0B1120]">Car Health Score</DialogTitle>
        </DialogHeader>

        {/* Score summary */}
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="h-16 w-16 rounded-full border-4 flex items-center justify-center flex-shrink-0" style={{ borderColor: color }}>
            <span className="font-heading font-black text-xl" style={{ color }}>{Math.round(score)}</span>
          </div>
          <div>
            <p className={`text-lg font-extrabold ${textColor}`}>{getHealthScoreLabel(score)}</p>
            <p className="text-xs text-slate-500">Based on the maintenance activity you have recorded in ServCheck</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Positive factors */}
          {positives.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Adding to your score</p>
              <ul className="space-y-1.5">
                {positives.map((f, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <TrendingUp className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      {f.name}
                    </span>
                    <span className="text-sm font-black text-emerald-600 flex-shrink-0">+{f.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Negative factors */}
          {negatives.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Lowering your score</p>
              <ul className="space-y-1.5">
                {negatives.map((f, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <TrendingDown className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      {f.name}
                    </span>
                    <span className="text-sm font-black text-amber-600 flex-shrink-0">{f.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {factors.length === 0 && (
            <p className="text-sm text-slate-500">No activity recorded yet. Add logbook entries to build your score.</p>
          )}

          {/* How it works */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">How the score works</p>
            <ul className="space-y-1 text-xs text-slate-500 leading-relaxed list-disc pl-4">
              <li>You earn points for what you record — up to 100</li>
              <li>+30 for having service history recorded</li>
              <li>+25 if serviced in the last 6 months (+15 if within 12)</li>
              <li>+15 if your next service due date or odometer is recorded</li>
              <li>+10 if no predicted service is overdue</li>
              <li>Up to +20 for attaching receipts to your services</li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            This score reflects the maintenance records you have entered into ServCheck. It is not an assessment of your vehicle's actual mechanical condition, roadworthiness, or safety. Only a qualified mechanic who has inspected your vehicle can assess its condition.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="w-full h-11 rounded-xl bg-[#0B1120] text-white font-heading font-bold text-sm hover:bg-slate-800 transition-colors"
        >
          Close
        </button>
      </DialogContent>
    </Dialog>
  );
}