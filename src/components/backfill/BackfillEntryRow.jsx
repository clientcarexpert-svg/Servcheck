import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

// One editable past-service row inside the bulk backfill review list
export default function BackfillEntryRow({ row, index, onChange, onRemove }) {
  const set = (field, value) => onChange(index, { ...row, [field]: value });
  const invalid = !row.service_date || !row.odometer || !row.service_type;

  return (
    <div className={`rounded-xl border p-3 space-y-2 bg-background ${invalid ? "border-amber-300" : "border-border"}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Service #{index + 1}</p>
        <button type="button" onClick={() => onRemove(index)} className="text-muted-foreground hover:text-destructive transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input type="date" value={row.service_date} onChange={e => set("service_date", e.target.value)} className="h-9 bg-secondary/50 border-0 text-sm" />
        <Input type="number" placeholder="Odometer (km) *" value={row.odometer} onChange={e => set("odometer", e.target.value)} className="h-9 bg-secondary/50 border-0 text-sm" />
      </div>
      <Input placeholder="Service type * (e.g. Logbook Service)" value={row.service_type} onChange={e => set("service_type", e.target.value)} className="h-9 bg-secondary/50 border-0 text-sm" />
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Workshop (optional)" value={row.mechanic_name} onChange={e => set("mechanic_name", e.target.value)} className="h-9 bg-secondary/50 border-0 text-sm" />
        <Input type="number" placeholder="Cost AUD (optional)" value={row.cost} onChange={e => set("cost", e.target.value)} className="h-9 bg-secondary/50 border-0 text-sm" />
      </div>
      {invalid && <p className="text-[11px] text-amber-600">Date, odometer and service type are required.</p>}
    </div>
  );
}