import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ShieldAlert, AlertTriangle, Clock, Loader2, ListChecks } from "lucide-react";

// Guardrail: items matching these are always forced to safety_critical,
// regardless of what the LLM returns.
const SAFETY_REGEX = /brake|tyre|tire|steering|suspension|shock absorber|strut|head ?light|tail ?light|brake light|indicator|seat ?belt|airbag|wheel bearing|ball joint|tie rod|cv joint|wheel alignment/i;

const STYLES = {
  safety_critical: {
    icon: ShieldAlert,
    label: "Safety critical — do not defer",
    chip: "bg-red-100 text-red-700",
    iconColor: "text-red-600",
  },
  due_now: {
    icon: AlertTriangle,
    label: "Due now — deferring risks bigger costs",
    chip: "bg-amber-100 text-amber-700",
    iconColor: "text-amber-600",
  },
  deferrable: {
    icon: Clock,
    label: "Deferrable — can wait if budget is tight",
    chip: "bg-emerald-100 text-emerald-700",
    iconColor: "text-emerald-600",
  },
};

function enforceSafetyGuardrail(items) {
  return items.map((entry) => {
    if (SAFETY_REGEX.test(entry.item || "")) {
      return {
        ...entry,
        classification: "safety_critical",
        reason: entry.classification === "safety_critical"
          ? entry.reason
          : "This affects braking, steering, tyres, suspension or lights — never defer safety items.",
      };
    }
    return entry;
  });
}

export default function WhatCanISkip({ quote }) {
  const [items, setItems] = useState(quote.skip_analysis || null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (items?.length || !quote.whats_included?.length) return;

    const classify = async () => {
      setLoading(true);
      try {
        const lineItems = quote.whats_included.map((w) => w.item).filter(Boolean);
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an Australian automotive service advisor. A driver received a quote for "${quote.service_type}" on a ${quote.car_year} ${quote.car_make} ${quote.car_model}${quote.odometer ? ` with ${quote.odometer.toLocaleString()} km` : ""}.

Classify EACH of the following service line items into exactly one of these categories:
- "safety_critical": affects braking, tyres, steering, suspension, or lights. NEVER advise deferring these.
- "due_now": not directly safety related, but deferring it risks significantly bigger repair costs soon (e.g. engine oil, timing belt, coolant leak).
- "deferrable": can reasonably wait a few months if budget is tight (e.g. cabin filter, wiper blades, cosmetic items).

Line items:
${lineItems.map((it, i) => `${i + 1}. ${it}`).join("\n")}

For each item give a one-sentence plain-English reason a non-mechanic can understand. Be conservative: if in doubt between two categories, choose the more urgent one. Never suggest skipping anything safety related.`,
          response_json_schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    item: { type: "string" },
                    classification: { type: "string", enum: ["safety_critical", "due_now", "deferrable"] },
                    reason: { type: "string" },
                  },
                },
              },
            },
          },
        });

        const classified = enforceSafetyGuardrail(res.items || []);
        setItems(classified);
        // Cache on the record so revisits don't re-run the analysis
        await base44.entities.QuoteCheck.update(quote.id, { skip_analysis: classified });
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    };
    classify();
  }, [quote.id]);

  if (!quote.whats_included?.length || failed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="h-9 w-9 rounded-xl bg-[#0B1120] flex items-center justify-center flex-shrink-0">
          <ListChecks className="h-4 w-4 text-white" />
        </div>
        <h2 className="font-heading font-bold text-base">What can I skip?</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">How urgent each item on your quote really is</p>

      {/* Prominent disclaimer */}
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 mb-4 flex items-start gap-2">
        <ShieldAlert className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs font-semibold text-amber-900 leading-relaxed">
          General information only — confirm safety items with a licensed mechanic.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Reviewing your line items...</span>
        </div>
      )}

      {items?.length > 0 && (
        <div className="space-y-3">
          {items.map((entry, i) => {
            const style = STYLES[entry.classification] || STYLES.due_now;
            const Icon = style.icon;
            return (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${style.iconColor}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#0B1120]">{entry.item}</p>
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mt-1 ${style.chip}`}>
                      {style.label}
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1.5">{entry.reason}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}