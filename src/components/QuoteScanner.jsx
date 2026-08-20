import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, FileText, X, Loader2, ChevronDown, ChevronUp, AlertTriangle, Zap, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import DamageAnalysis from "@/components/damage/DamageAnalysis";

export default function QuoteScanner({ onExtracted, onPartialData }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [damageData, setDamageData] = useState(null);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  const processQuote = async (file_url) => {
    // Step 1: Extract structured data from the quote image — no LLM, no PII processing
    const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          shop_name: { type: "string", description: "Workshop or mechanic business name" },
          suburb: { type: "string", description: "Suburb from the quote" },
          state: { type: "string", description: "Australian state abbreviation" },
          car_make: { type: "string", description: "Vehicle make" },
          car_model: { type: "string", description: "Vehicle model" },
          car_year: { type: "string", description: "Vehicle year" },
          service_type: { type: "string", description: "Primary service type" },
          total_quoted: { type: "number", description: "Total quoted price in AUD" },
          gst_included: { type: "boolean", description: "Whether GST is included in the total" },
          line_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                quoted_price: { type: "number" }
              }
            },
            description: "Individual line items from the quote"
          }
        }
      }
    });

    const extracted = extractResult.status === "success" ? (extractResult.output || {}) : {};

    // Step 2: Analyse the extracted data (text only, no images, no PII) using LLM
    const analysisPrompt = `You are an Australian mechanic pricing analyst. Analyse this quote data and assess fairness.

QUOTE DATA (already extracted, no images, no business identifiers):
- Location: ${extracted.suburb || "Unknown"}, ${extracted.state || "Unknown"}
- Car: ${extracted.car_make || ""} ${extracted.car_model || ""} ${extracted.car_year || ""}
- Service: ${extracted.service_type || "Unknown"}
- Total Quoted: $${extracted.total_quoted || 0}
- GST Included: ${extracted.gst_included ?? "unknown"}
- Line Items: ${JSON.stringify(extracted.line_items || [])}

PRICING RULES:
- Apply 20-30% industry markup on parts cost for workshop overhead.
- Display fair prices as a range (low-high).
- Factor in realistic Australian labour rates for the suburb/state.
- BS meter (1-10) should reflect suburb-specific pricing, not national average.

For each line item: is the price fair, high, or a ripoff? Detect suspicious patterns.
Provide a summary verdict, note GST status, and an overall bs_meter score.`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          suburb: { type: "string" },
          state: { type: "string" },
          car_make: { type: "string" },
          car_model: { type: "string" },
          car_year: { type: "string" },
          service_type: { type: "string" },
          total_quoted: { type: "number" },
          gst_included: { type: "boolean" },
          gst_amount: { type: "number" },
          total_with_gst: { type: "number" },
          autoguru_reference_price: { type: "number" },
          line_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                quoted_price: { type: "number" },
                fair_price_low: { type: "number" },
                fair_price_high: { type: "number" },
                verdict: { type: "string", enum: ["fair", "high", "ripoff"] },
                note: { type: "string" }
              }
            }
          },
          red_flags: { type: "array", items: { type: "string" } },
          summary: { type: "string" },
          bs_meter: { type: "number" },
          suggested_total: { type: "number" }
        }
      }
    });

    // Silently log anonymised pricing data to historical database (no shop name = no PII)
    if (res?.line_items?.length > 0) {
      base44.entities.HistoricalPricing.create({
        service_type: res.service_type || "Unknown",
        // shop_name omitted — business identifiers are not stored
        suburb: res.suburb || "",
        state: res.state || "",
        total_quoted: res.total_quoted,
        suggested_total: res.suggested_total,
        bs_meter: res.bs_meter,
        line_items: res.line_items,
      }).catch(() => {}); // fire and forget
    }

    // Show full results if we have line items and a total — always show the analysis
    const hasLineItems = res?.line_items?.length > 0;
    const hasTotal = res?.total_quoted;

    if (hasLineItems || hasTotal) {
      setResult(res);
      setExpanded(true);
      if (onExtracted) onExtracted(res);
      // Also prefill the form with whatever we extracted
      if (onPartialData && (res?.service_type || res?.total_quoted)) {
          const services = res?.service_type ? [res.service_type] : [];
          onPartialData({
            car_make: res?.car_make || "",
            car_model: res?.car_model || "",
            car_year: res?.car_year || "",
            selected_services: services,
            mechanic_price: res?.total_quoted ? String(res.total_quoted) : "",
            dealership_price: "",
            state: res?.state || "",
            suburb: res?.suburb || "",
            // quote_notes omitted — AI summary not prefilled to avoid LLM-generated text re-entering prompts
          });
        }
      } else {
        // Not detailed enough — prefill form and show message
        setPrefilled(true);
        if (onPartialData) {
          const services = res?.service_type ? [res.service_type] : [];
          onPartialData({
            car_make: res?.car_make || "",
            car_model: res?.car_model || "",
            car_year: res?.car_year || "",
            selected_services: services,
            mechanic_price: res?.total_quoted ? String(res.total_quoted) : "",
            dealership_price: "",
            state: res?.state || "",
            suburb: res?.suburb || "",
            // quote_notes omitted — AI summary not prefilled to avoid LLM-generated text re-entering prompts
          });
        }
      }
    setLoading(false);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setLoading(true);
    setResult(null);
    setDamageData(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Classify: quote document vs photo of vehicle damage
      const classification = await base44.integrations.Core.InvokeLLM({
        prompt: `Classify this image. Is it:
- "quote_document": a mechanic quote, invoice, estimate or receipt (a document with prices/line items)
- "vehicle_photo": a photo of a car, car part, engine bay, tyre, or visible vehicle damage
- "other": anything else
If it is a vehicle photo, also identify the car make, model and year if visible (leave blank if not identifiable).`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            image_type: { type: "string", enum: ["quote_document", "vehicle_photo", "other"] },
            car_make: { type: "string" },
            car_model: { type: "string" },
            car_year: { type: "string" },
          },
        },
      });

      if (classification?.image_type === "vehicle_photo") {
        setDamageData({
          fileUrl: file_url,
          detected: {
            car_make: classification.car_make || "",
            car_model: classification.car_model || "",
            car_year: classification.car_year || "",
          },
        });
        setLoading(false);
        return;
      }

      await processQuote(file_url);
    } catch (err) {
      toast.error('Failed to scan. Please try again.');
      setLoading(false);
    }
  };

  const verdictColor = { fair: "text-emerald-600", high: "text-amber-600", ripoff: "text-red-600" };
  const verdictBg = { fair: "bg-emerald-50 border-emerald-200", high: "bg-amber-50 border-amber-200", ripoff: "bg-red-50 border-red-200" };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-accent" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Instant Quote Analyser</span>
            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Market</span>
            <span className="text-[10px] bg-purple-100 text-purple-700 border border-purple-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Beta</span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground border border-border rounded-full px-1.5 py-0.5">
              <Lock className="h-2.5 w-2.5" /> Secure
            </span>
          </div>
        </div>
        {result && (
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground transition-colors">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>

      {prefilled ? (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
          <span className="text-amber-500 text-lg mt-0.5">📋</span>
          <div>
            <p className="text-xs font-semibold text-amber-800">We've prefilled what we found</p>
            <p className="text-xs text-amber-700 mt-0.5">Your quote didn't have enough detail for a full analysis. We've filled in the form below — just complete the missing fields and hit Analyse.</p>
            <button onClick={() => setPrefilled(false)} className="text-xs text-amber-600 underline mt-1">Scan again</button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground leading-relaxed">Snap a photo of your quote or any vehicle damage — we instantly break down every line item and flag overcharges.</p>
      )}

      {damageData && !loading && (
        <DamageAnalysis
          fileUrl={damageData.fileUrl}
          detected={damageData.detected}
          onClear={() => setDamageData(null)}
        />
      )}

      {!result && !loading && !prefilled && !damageData && (
        <div className="flex gap-3">
          <button
            onClick={() => cameraRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-white font-semibold text-sm transition-all shadow-md shadow-orange-400/30 hover:shadow-lg hover:shadow-orange-400/40 hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea6c0a)' }}
          >
            <Camera className="h-4 w-4" />
            Snap Photo
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 font-medium text-sm transition-colors"
          >
            <FileText className="h-4 w-4" />
            Upload File
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-4 text-accent">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Scanning your photo…</span>
        </div>
      )}

      <AnimatePresence>
        {result && expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
            {/* Summary */}
            <div className="rounded-lg bg-card border border-border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Quoted</span>
                <span className="font-heading font-bold text-lg">${result.total_quoted?.toLocaleString()}</span>
              </div>
              {result.suggested_total && result.suggested_total < result.total_quoted && (
                <p className="text-xs text-emerald-700 font-medium">💡 Suggested fair total: ${result.suggested_total?.toLocaleString()} (save ${(result.total_quoted - result.suggested_total).toLocaleString()})</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
            </div>

            {/* BS Meter */}
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs font-medium text-muted-foreground w-20">BS Meter</span>
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${(result.bs_meter / 10) * 100}%`, background: result.bs_meter >= 7 ? "#ef4444" : result.bs_meter >= 4 ? "#f59e0b" : "#22c55e" }} />
              </div>
              <span className="text-xs font-bold w-6 text-right">{result.bs_meter}/10</span>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              {result.line_items?.map((item, i) => (
                <div key={i} className={`rounded-lg border p-3 ${verdictBg[item.verdict] || "bg-secondary/50 border-border"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium flex-1">{item.description}</p>
                    <div className="text-right flex-shrink-0">
                      <p className="font-heading font-bold text-sm">${item.quoted_price?.toLocaleString()}</p>
                      <p className={`text-xs font-medium capitalize ${verdictColor[item.verdict]}`}>{item.verdict}</p>
                    </div>
                  </div>
                  {item.note && <p className="text-xs text-muted-foreground mt-1">{item.note}</p>}
                  {(item.fair_price_low || item.fair_price_high) && (
                    <p className="text-xs text-muted-foreground mt-0.5">Fair range: ${item.fair_price_low?.toLocaleString()}–${item.fair_price_high?.toLocaleString()}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Red flags */}
            {result.red_flags?.length > 0 && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">Red Flags</span>
                </div>
                {result.red_flags.map((f, i) => <p key={i} className="text-xs text-red-700">• {f}</p>)}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={() => { setResult(null); setExpanded(false); }} className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">
                <X className="h-3.5 w-3.5" /> Clear
              </button>
              <button onClick={() => fileRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors">
                Scan another
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
    </div>
  );
}