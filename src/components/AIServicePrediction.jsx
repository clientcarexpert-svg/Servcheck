import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ChevronDown, ChevronUp, AlertTriangle, DollarSign, Gauge } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const URGENCY_STYLES = {
  immediate: "bg-red-50 border-red-200 text-red-700",
  soon: "bg-amber-50 border-amber-200 text-amber-700",
  upcoming: "bg-blue-50 border-blue-200 text-blue-700",
  future: "bg-secondary border-border text-muted-foreground",
};

// Only urgent items get a badge — everything else is km-based only
const URGENCY_LABELS = {
  immediate: "Due Now",
};

// Estimate annual driving rate from service history; fall back to AU average
function estimateKmPerYear(entries) {
  const dated = entries
    .filter(e => e.odometer && e.service_date)
    .sort((a, b) => new Date(a.service_date) - new Date(b.service_date));
  if (dated.length >= 2) {
    const first = dated[0];
    const last = dated[dated.length - 1];
    const kmDiff = last.odometer - first.odometer;
    const years = (new Date(last.service_date) - new Date(first.service_date)) / (365.25 * 24 * 60 * 60 * 1000);
    if (kmDiff > 0 && years > 0.25) return Math.round(kmDiff / years);
  }
  return 13000; // Australian average
}

// Forecast = sum of only the items the car will actually reach in the next 12 months
function computeForecast(prediction, currentKm, kmPerYear) {
  const items = prediction?.upcoming_items || [];
  const reachable = items.filter(item => {
    if (item.due_km && currentKm) return item.due_km <= currentKm + kmPerYear;
    return item.urgency === "immediate" || item.urgency === "soon";
  });
  if (reachable.length === 0) return { low: 0, high: 0, count: 0 };
  return {
    low: reachable.reduce((s, i) => s + (i.estimated_cost_low || 0), 0),
    high: reachable.reduce((s, i) => s + (i.estimated_cost_high || 0), 0),
    count: reachable.length,
  };
}

export default function AIServicePrediction({ entries }) {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [expanded, setExpanded] = useState(true);

  const latestEntry = entries?.[0];

  const handlePredict = async () => {
    if (!latestEntry) return;
    setLoading(true);

    // mechanic_name excluded — business names are not passed to LLM
    const historyText = entries.slice(0, 10).map(e =>
      `- ${e.service_date}: ${e.service_type} at ${e.odometer?.toLocaleString()} km, cost $${e.cost || "unknown"}${e.parts_replaced?.length ? `, parts: ${e.parts_replaced.map(p => p.part).join(", ")}` : ""}`
    ).join("\n");

    const kmPerYear = estimateKmPerYear(entries);

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert Australian automotive technician. Based on this vehicle's service history, predict upcoming maintenance needs.

Vehicle: ${latestEntry.car_year} ${latestEntry.car_make} ${latestEntry.car_model}
Current odometer: ${latestEntry.odometer?.toLocaleString()} km
Estimated driving rate: ~${kmPerYear.toLocaleString()} km per year
State: ${latestEntry.state || "Australia"}

Recent service history:
${historyText}

IMPORTANT: All predictions must be ODOMETER-BASED, not time-based. This car is driven at roughly ${kmPerYear.toLocaleString()} km/year, so an item due at 160,000 km is YEARS away — never mark distant-km items as urgent.

CRITICAL — DO NOT DOUBLE-COUNT COMPLETED WORK: Cross-check every prediction against the service history above. If a service or part replacement has already been done (e.g. spark plugs replaced at a recent service), do NOT list it again — its next due-km is one full interval AFTER the km it was last done. If all interval services are covered by the history, return an empty upcoming_items list.

Tasks:
1. Based on the odometer and known service intervals for this exact make/model/year, list upcoming maintenance items. Be SPECIFIC — include the due-km for each (e.g. "timing belt due at 100,000 km on this model").
2. Set each item's urgency purely by km remaining from the current odometer: "immediate" = overdue or within 1,000 km; "soon" = within 5,000 km; "upcoming" = within 15,000 km; "future" = beyond 15,000 km.
3. Flag any KNOWN RELIABILITY ISSUES for this specific make/model/year that owners should watch for.
4. Estimate total spend in the next 12 months using Australian workshop rates — ONLY include items the car will actually reach within ~${kmPerYear.toLocaleString()} km of driving. Do not inflate the forecast with far-off services.

Use real-world knowledge about this car's reliability reputation. Don't be generic.`,
      response_json_schema: {
        type: "object",
        properties: {
          health_summary: { type: "string" },
          upcoming_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { type: "string" },
                reason: { type: "string" },
                estimated_cost_low: { type: "number" },
                estimated_cost_high: { type: "number" },
                urgency: { type: "string", enum: ["immediate", "soon", "upcoming", "future"] },
                due_km: { type: "number" },
              }
            }
          },
          known_issues: {
            type: "array",
            items: { type: "object", properties: { issue: { type: "string" }, note: { type: "string" } } }
          },
          forecast_12mo_low: { type: "number" },
          forecast_12mo_high: { type: "number" },
        }
      }
    });

    setPrediction(res);
    setLoading(false);
  };

  if (!latestEntry) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Service Prediction</p>
            <p className="text-xs text-muted-foreground">{latestEntry.car_year} {latestEntry.car_make} {latestEntry.car_model} · {latestEntry.odometer?.toLocaleString()} km</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {prediction && (
            <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground p-1">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
          {!prediction && !loading && (
            <Button onClick={handlePredict} size="sm" className="bg-primary text-primary-foreground h-8 text-xs px-3">
              Analyse
            </Button>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analysing…
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {prediction && expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="p-5 space-y-5">
              {/* AI Disclaimer */}
              <p className="text-[11px] text-muted-foreground/70 leading-relaxed bg-slate-50 border border-border rounded-lg px-3 py-2">
                ⚠️ Automated estimate only — for informational purposes. Not professional mechanical advice. Always consult a qualified mechanic before making decisions.
              </p>

              {/* 12-month forecast — computed from items actually reachable this year */}
              {(() => {
                const kmPerYear = estimateKmPerYear(entries);
                const forecast = computeForecast(prediction, latestEntry.odometer, kmPerYear);
                return (
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">12-Month Forecast</span>
                    </div>
                    {forecast.count > 0 ? (
                      <>
                        <p className="font-heading text-xl font-bold">${forecast.low.toLocaleString()}–${forecast.high.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Gauge className="h-3 w-3" /> {forecast.count} service{forecast.count > 1 ? "s" : ""} reachable at ~{kmPerYear.toLocaleString()} km/year
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-heading text-xl font-bold">$0</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Gauge className="h-3 w-3" /> no scheduled services due within ~{kmPerYear.toLocaleString()} km of driving
                        </p>
                      </>
                    )}
                  </div>
                );
              })()}

              <p className="text-sm text-muted-foreground leading-relaxed">{prediction.health_summary}</p>

              {/* Upcoming items */}
              {prediction.upcoming_items?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming Maintenance</p>
                  {prediction.upcoming_items.map((item, i) => (
                    <div key={i} className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${URGENCY_STYLES[item.urgency] || URGENCY_STYLES.future}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{item.item}</p>
                          {URGENCY_LABELS[item.urgency] && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70 border border-current rounded px-1.5 py-0.5">{URGENCY_LABELS[item.urgency]}</span>
                          )}
                        </div>
                        <p className="text-xs opacity-70 mt-0.5">{item.reason}</p>
                        {item.due_km && <p className="text-xs mt-0.5 font-medium">Due at {item.due_km?.toLocaleString()} km</p>}
                      </div>
                      <p className="text-sm font-heading font-semibold flex-shrink-0">${item.estimated_cost_low?.toLocaleString()}–${item.estimated_cost_high?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Known issues */}
              {prediction.known_issues?.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Known Issues — {latestEntry.car_make} {latestEntry.car_model}</p>
                  </div>
                  {prediction.known_issues.map((issue, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-medium text-amber-800">{issue.issue}</p>
                      <p className="text-xs text-amber-700 mt-0.5">{issue.note}</p>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => { setPrediction(null); }} className="text-xs text-muted-foreground hover:underline">Re-analyse</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}