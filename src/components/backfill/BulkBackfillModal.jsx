import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, FileText, Loader2, Plus, History, X } from "lucide-react";
import { toast } from "sonner";
import BackfillEntryRow from "./BackfillEntryRow";

const SCAN_PROMPT = `You are a privacy-safe automotive service history parser. The attached image/PDF is a car logbook page, service booklet, or old invoice. It may contain MULTIPLE separate service records (e.g. logbook stamps).

HARD RULES — no exceptions:
1. NEVER output any customer name, person name, or initials.
2. NEVER output any home or street address.
3. NEVER output any phone number or email address.
4. NEVER output any licence plate, registration number, or VIN.
5. NEVER output any payment card, BSB, or bank account detail.
6. "mechanic_name" = WORKSHOP/BUSINESS name only — never a person's name.
7. Return ONE object per distinct service record found. If a field is unreadable, omit it.
8. Dates as YYYY-MM-DD. If only month/year is visible, use the 1st of that month.

Return a "services" array where each item has: service_date, odometer (km number), service_type (job category label, e.g. "Logbook Service"), cost (AUD number if shown), mechanic_name.`;

const BLANK_ROW = { service_date: "", odometer: "", service_type: "", cost: "", mechanic_name: "" };

export default function BulkBackfillModal({ defaultVehicle, onClose, onSaved }) {
  const [vehicle, setVehicle] = useState({
    car_make: defaultVehicle?.car_make || "",
    car_model: defaultVehicle?.car_model || "",
    car_year: defaultVehicle?.car_year || "",
  });
  const [rows, setRows] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  const vehicleReady = vehicle.car_make && vehicle.car_model && vehicle.car_year;
  const rowsValid = rows.length > 0 && rows.every(r => r.service_date && r.odometer && r.service_type);

  const handleScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setScanning(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: SCAN_PROMPT,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            services: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  service_date: { type: "string" },
                  odometer: { type: "number" },
                  service_type: { type: "string" },
                  cost: { type: "number" },
                  mechanic_name: { type: "string" },
                },
              },
            },
          },
        },
      });
      const found = (result?.services || []).map(s => ({
        service_date: s.service_date || "",
        odometer: s.odometer ? String(s.odometer) : "",
        service_type: s.service_type || "",
        cost: s.cost ? String(s.cost) : "",
        mechanic_name: s.mechanic_name || "",
      }));
      if (found.length === 0) {
        toast.error("No service records found in that image — try a clearer photo or add rows manually.");
      } else {
        setRows(p => [...p, ...found]);
        toast.success(`Found ${found.length} service record${found.length > 1 ? "s" : ""} — review below.`);
      }
    } catch {
      toast.error("Couldn't read that file. Try again or add rows manually.");
    } finally {
      setScanning(false);
    }
  };

  const updateRow = (i, newRow) => setRows(p => p.map((r, idx) => (idx === i ? newRow : r)));
  const removeRow = (i) => setRows(p => p.filter((_, idx) => idx !== i));

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const payload = rows.map(r => ({
        ...vehicle,
        service_date: r.service_date,
        odometer: parseInt(r.odometer),
        service_type: r.service_type,
        cost: r.cost ? parseFloat(r.cost) : undefined,
        mechanic_name: r.mechanic_name || undefined,
      }));
      await base44.entities.LogbookEntry.bulkCreate(payload);
      toast.success(`${payload.length} past service${payload.length > 1 ? "s" : ""} added to your logbook.`);
      onSaved();
    } catch {
      toast.error("Couldn't save the entries. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-card w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#1a237e]/10 flex items-center justify-center">
              <History className="h-4 w-4 text-[#1a237e]" />
            </div>
            <div>
              <p className="font-heading font-bold text-base">Backfill Past History</p>
              <p className="text-xs text-muted-foreground">Add years of old services in one go</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X className="h-5 w-5" /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-5 flex-1">
          {/* What this is for + workflow */}
          <div className="rounded-xl bg-[#1a237e]/5 border border-[#1a237e]/10 p-4">
            <p className="text-sm font-semibold text-[#1a237e] mb-1">Why backfill your history?</p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Got an older car with years of services on paper? Adding them here builds your car's full digital history — so your service predictions, reminders and maintenance score reflect what's actually been done.
            </p>
            <div className="space-y-1.5">
              {[
                "Enter your car's make, model and year below",
                "Scan each logbook page or old invoice — multiple stamps are picked up in one photo",
                "Review the entries, fix anything, then save them all at once",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-[#1a237e] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-xs text-foreground/80 leading-snug">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Vehicle (applies to all entries)</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Make *</Label>
                <Input placeholder="Toyota" value={vehicle.car_make} onChange={e => setVehicle(v => ({ ...v, car_make: e.target.value }))} className="h-9 bg-secondary/50 border-0 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Model *</Label>
                <Input placeholder="Corolla" value={vehicle.car_model} onChange={e => setVehicle(v => ({ ...v, car_model: e.target.value }))} className="h-9 bg-secondary/50 border-0 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Year *</Label>
                <Input placeholder="2014" value={vehicle.car_year} onChange={e => setVehicle(v => ({ ...v, car_year: e.target.value }))} className="h-9 bg-secondary/50 border-0 text-sm" />
              </div>
            </div>
          </div>

          {/* Scan / add */}
          <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Scan a logbook page, service booklet or old invoice — multiple stamps on one page are picked up together. Scan as many pages as you need.
            </p>
            {scanning ? (
              <div className="flex items-center justify-center gap-2 h-9 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Reading page…
              </div>
            ) : (
              <div className="flex gap-2">
                <button type="button" onClick={() => cameraRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-secondary text-muted-foreground text-xs font-medium hover:bg-secondary/80 transition-colors border border-border">
                  <Camera className="h-3.5 w-3.5" /> Camera
                </button>
                <button type="button" onClick={() => fileRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-secondary text-muted-foreground text-xs font-medium hover:bg-secondary/80 transition-colors border border-border">
                  <FileText className="h-3.5 w-3.5" /> Upload
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleScan} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScan} />
          </div>

          {/* Review rows */}
          {rows.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Review ({rows.length})</p>
              {rows.map((row, i) => (
                <BackfillEntryRow key={i} row={row} index={i} onChange={updateRow} onRemove={removeRow} />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setRows(p => [...p, { ...BLANK_ROW }])}
            className="w-full h-9 rounded-lg border-2 border-dashed border-border text-muted-foreground text-xs font-semibold hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Add a service manually
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex-shrink-0">
          <Button
            onClick={handleSaveAll}
            disabled={!vehicleReady || !rowsValid || saving || scanning}
            className="w-full h-11 font-heading font-bold rounded-xl"
          >
            {saving ? "Saving…" : rows.length > 0 ? `Save ${rows.length} Entr${rows.length === 1 ? "y" : "ies"} to Logbook` : "Save to Logbook"}
          </Button>
          {!vehicleReady && <p className="text-[11px] text-muted-foreground text-center mt-2">Fill in the vehicle make, model and year first.</p>}
        </div>
      </div>
    </div>
  );
}