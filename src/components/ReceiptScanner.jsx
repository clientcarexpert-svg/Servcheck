import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, FileText, Loader2, Scan } from "lucide-react";

export default function ReceiptScanner({ onExtracted }) {
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  const STRICT_PROMPT = `You are a privacy-safe automotive receipt parser. Extract ONLY the structured vehicle/service fields below.

HARD RULES — no exceptions:
1. NEVER output any customer name, person name, or initials.
2. NEVER output any home or street address.
3. NEVER output any phone number or email address.
4. NEVER output any licence plate, registration number, or VIN.
5. NEVER output any payment card, BSB, or bank account detail.
6. "mechanic_name" = WORKSHOP/BUSINESS name only — never a person's name.
7. "service_type" = job category label only (e.g. "Logbook Service") — no customer references.
8. Return ONLY the JSON fields listed — nothing else.

EXTRACT ONLY: mechanic_name, service_date (YYYY-MM-DD), odometer (km number), cost (AUD number), service_type, car_make, car_model, car_year, parts (array of {part, brand}).`;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: STRICT_PROMPT,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            mechanic_name: { type: "string" },
            service_date: { type: "string" },
            odometer: { type: "number" },
            cost: { type: "number" },
            service_type: { type: "string" },
            car_make: { type: "string" },
            car_model: { type: "string" },
            car_year: { type: "string" },
            parts: {
              type: "array",
              items: { type: "object", properties: { part: { type: "string" }, brand: { type: "string" } } }
            }
          }
        }
      });
      // notes field deliberately omitted — no free-text field that could carry PII
      if (onExtracted) onExtracted(result || {});
    } catch {
      // error handled by caller
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Scan className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Scan Receipt — auto-fill form</span>
        </div>
        {loading && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Scanning…</div>}
      </div>
      {!loading && (
        <div className="flex gap-2">
          <button onClick={() => cameraRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-secondary text-muted-foreground text-xs font-medium hover:bg-secondary/80 transition-colors border border-border">
            <Camera className="h-3.5 w-3.5" /> Camera
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-secondary text-muted-foreground text-xs font-medium hover:bg-secondary/80 transition-colors border border-border">
            <FileText className="h-3.5 w-3.5" /> Upload
          </button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
    </div>
  );
}