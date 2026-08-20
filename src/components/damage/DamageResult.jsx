import { AlertTriangle, Wrench } from "lucide-react";

const severityStyle = {
  minor: "bg-emerald-50 border-emerald-200 text-emerald-700",
  moderate: "bg-amber-50 border-amber-200 text-amber-700",
  severe: "bg-red-50 border-red-200 text-red-700",
};

export default function DamageResult({ result, onReset }) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-card border border-border p-3">
        <div className="flex items-center gap-2 mb-1">
          <Wrench className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Visual Assessment</span>
        </div>
        <p className="text-sm text-foreground">{result.overall_assessment}</p>
        {(result.repair_cost_low || result.repair_cost_high) && (
          <p className="text-xs text-muted-foreground mt-2">
            Indicative repair range: <strong>${result.repair_cost_low?.toLocaleString()}–${result.repair_cost_high?.toLocaleString()} AUD</strong> (varies by workshop and parts availability)
          </p>
        )}
      </div>

      <div className="space-y-2">
        {result.identified_parts?.map((p, i) => (
          <div key={i} className={`rounded-lg border p-3 ${severityStyle[p.severity] || "bg-secondary/50 border-border"}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold flex-1">{p.part}</p>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold capitalize">{p.severity}</p>
                <p className="text-[10px] opacity-80">{p.confidence}% confidence</p>
              </div>
            </div>
            <p className="text-xs mt-1 opacity-90">{p.explanation}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-secondary border border-border p-3 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          This is an automated assessment based only on what is visible in your photo. It is not a professional inspection and may miss hidden or internal damage. Always have the vehicle inspected by a qualified mechanic before making repair decisions.
        </p>
      </div>

      <button onClick={onReset} className="w-full h-9 rounded-lg border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">
        Scan another photo
      </button>
    </div>
  );
}