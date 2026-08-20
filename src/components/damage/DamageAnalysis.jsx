import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Camera } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import DamageResult from "./DamageResult";

export default function DamageAnalysis({ fileUrl, detected = {}, onClear }) {
  const [carMake, setCarMake] = useState(detected.car_make || "");
  const [carModel, setCarModel] = useState(detected.car_model || "");
  const [carYear, setCarYear] = useState(detected.car_year || "");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyse = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an experienced Australian automotive technician reviewing a photo of a vehicle or vehicle part.

VEHICLE DETAILS PROVIDED BY OWNER:
- Make: ${carMake || "Unknown"}
- Model: ${carModel || "Unknown"}
- Year: ${carYear || "Unknown"}
- Owner notes: ${notes || "None"}

TASK:
1. Examine the photo carefully and identify each visible component.
2. For each component that appears damaged, broken, worn, leaking or missing, name the part, describe the visible condition factually, rate severity (minor/moderate/severe) and your confidence (0-100).
3. Provide an overall factual assessment of what is visibly wrong. Do NOT give advice or recommendations — describe only what is observable.
4. Estimate a realistic Australian repair cost range (parts + labour, AUD) for the visible damage on this specific vehicle if known.
5. If the image does not show a vehicle or vehicle part, say so in overall_assessment and return an empty parts list.
Be conservative — if something is unclear from the photo, use lower confidence rather than guessing.`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: "object",
          properties: {
            overall_assessment: { type: "string" },
            identified_parts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  part: { type: "string" },
                  severity: { type: "string", enum: ["minor", "moderate", "severe"] },
                  confidence: { type: "number" },
                  explanation: { type: "string" },
                },
              },
            },
            repair_cost_low: { type: "number" },
            repair_cost_high: { type: "number" },
          },
        },
      });
      // Normalise confidence: model sometimes returns 0-1 fractions instead of 0-100
      if (res?.identified_parts) {
        res.identified_parts = res.identified_parts.map((p) => ({
          ...p,
          confidence: p.confidence <= 1 ? Math.round(p.confidence * 100) : Math.round(p.confidence),
        }));
      }
      setResult(res);
    } catch (err) {
      toast.error("Couldn't analyse the photo. Please try again.");
    }
    setLoading(false);
  };

  if (result) return <DamageResult result={result} onReset={onClear} />;

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 flex items-start gap-2">
        <Camera className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">
          Looks like a photo of vehicle damage. Add your car details below (if you know them) so the assessment is more accurate — then we'll tell you what appears to be broken.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Input placeholder="Make" value={carMake} onChange={(e) => setCarMake(e.target.value)} className="text-sm" />
        <Input placeholder="Model" value={carModel} onChange={(e) => setCarModel(e.target.value)} className="text-sm" />
        <Input placeholder="Year" value={carYear} onChange={(e) => setCarYear(e.target.value)} className="text-sm" />
      </div>
      <div>
        <Input
          placeholder="Anything else? e.g. noise, when it happened (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="text-sm"
        />
        <p className="text-[10px] text-muted-foreground mt-1">Don't include personal information.</p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onClear} disabled={loading} className="flex-1">
          Cancel
        </Button>
        <Button onClick={analyse} disabled={loading} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Analysing…
            </>
          ) : (
            "Analyse Damage"
          )}
        </Button>
      </div>
      {!carMake && !loading && (
        <p className="text-[10px] text-muted-foreground text-center">Car details are optional — we'll still assess the photo, but results will be more general.</p>
      )}
    </div>
  );
}