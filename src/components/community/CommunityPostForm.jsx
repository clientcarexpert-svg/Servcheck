import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { Receipt, ShieldCheck, X } from "lucide-react";

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label} {required && <span className="text-accent">*</span>}
      </Label>
      {children}
    </div>
  );
}

const inputCls = "h-11 border-border bg-background";

export default function CommunityPostForm({
  form,
  update,
  onSubmit,
  submitting,
  receiptFile,
  setReceiptFile,
  onCancel,
}) {
  const fileInputRef = useRef();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_24px_-12px_rgba(16,24,40,0.16)]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border bg-secondary/40 px-6 py-4">
        <div>
          <h3 className="font-heading text-lg font-black text-foreground">Share what you paid</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Posted anonymously. Helps other owners spot unfair pricing.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} type="button" aria-label="Close">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Make" required>
            <Input placeholder="Toyota" value={form.car_make} onChange={(e) => update("car_make", e.target.value)} className={inputCls} required />
          </Field>
          <Field label="Model" required>
            <Input placeholder="Corolla" value={form.car_model} onChange={(e) => update("car_model", e.target.value)} className={inputCls} required />
          </Field>
          <Field label="Year" required>
            <Input placeholder="2019" value={form.car_year} onChange={(e) => update("car_year", e.target.value)} className={inputCls} required />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="State" required>
            <Select value={form.state} onValueChange={(v) => update("state", v)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent>{STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Suburb" required>
            <Input placeholder="e.g. Parramatta" value={form.suburb} onChange={(e) => update("suburb", e.target.value)} className={inputCls} required />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Service" required>
            <Input placeholder="e.g. Brake pads" value={form.service_type} onChange={(e) => update("service_type", e.target.value)} className={inputCls} required />
          </Field>
          <Field label="Price paid" required>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">$</span>
              <Input type="number" min="0" placeholder="0" value={form.price_paid} onChange={(e) => update("price_paid", e.target.value)} className={`${inputCls} pl-8`} required />
            </div>
          </Field>
        </div>

        <Field label="Workshop name (optional)">
          <Input placeholder="e.g. Bob's Auto" value={form.mechanic_name} onChange={(e) => update("mechanic_name", e.target.value)} className={inputCls} />
        </Field>

        <div>
          <input type="file" accept="image/*,application/pdf" ref={fileInputRef} className="hidden" onChange={(e) => setReceiptFile(e.target.files[0])} />
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className={`flex w-full items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3.5 text-left text-sm transition-colors ${
              receiptFile
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-border text-muted-foreground hover:border-accent/60 hover:bg-secondary/40"
            }`}
          >
            <Receipt className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">
              {receiptFile ? receiptFile.name : "Attach receipt or invoice"}
              <span className="block text-xs opacity-70">
                {receiptFile ? "Ready to verify" : "Optional — earns a Verified badge"}
              </span>
            </span>
          </button>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Reviewed before publishing
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {submitting ? "Posting..." : "Post anonymously"}
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}