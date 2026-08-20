import { useState } from "react";
import SEOHead from "../components/SEOHead";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldCheck, Wrench, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
const SPECIALTY_OPTIONS = ["Brakes", "Logbook Service", "European Cars", "Japanese Cars", "4WD / Off-road", "Transmission", "Suspension", "Air Conditioning", "Electrical", "Tyres", "Exhausts", "Engine Rebuilds", "Pre-Purchase Inspection"];

export default function PartnerSignup() {
  const [form, setForm] = useState({
    business_name: "", abn: "", landline_number: "", address: "",
    suburb: "", state: "", specialties: [], legal_accepted: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const toggleSpecialty = (s) => {
    const current = form.specialties;
    if (current.includes(s)) {
      update("specialties", current.filter(x => x !== s));
    } else if (current.length < 3) {
      update("specialties", [...current, s]);
    }
  };

  const isValid = form.business_name && form.abn && form.landline_number &&
    form.address && form.suburb && form.state && form.legal_accepted;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    await base44.functions.invoke('createWorkshopListing', { ...form });
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="font-heading font-bold text-2xl mb-2">Workshop Listed</h1>
          <p className="text-muted-foreground">Your workshop has been listed. Local drivers searching for alternatives will now find you.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <SEOHead
        title="Grow Your Workshop — Join ServCheck as a Verified Partner"
        description="List your workshop on ServCheck and connect with local car owners actively looking for trusted mechanics. Free to get started."
        path="/partner-signup"
      />
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="font-heading font-bold text-2xl">Join The Independent Grid</h1>
        </div>
        <p className="text-lg font-medium text-foreground">Are dealerships ripping off your local customers?</p>
        <p className="text-muted-foreground mt-1">Put your workshop on the ServCheck grid for FREE and connect with drivers looking for a fair price on a second opinion.</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Business info */}
        <div className="rounded-xl bg-secondary/40 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Business Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Business Name *</Label>
              <Input placeholder="e.g. Smith's Auto Repairs" value={form.business_name} onChange={e => update("business_name", e.target.value)} className="h-11 bg-background border-0 font-medium" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">ABN * (required for verification)</Label>
              <Input placeholder="e.g. 51 824 753 556" value={form.abn} onChange={e => update("abn", e.target.value)} className="h-11 bg-background border-0 font-medium" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Workshop Landline *</Label>
            <Input placeholder="e.g. 02 9876 5432" value={form.landline_number} onChange={e => update("landline_number", e.target.value)} className="h-11 bg-background border-0 font-medium" />
          </div>
        </div>

        {/* Location */}
        <div className="rounded-xl bg-secondary/40 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</p>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Full Address *</Label>
            <Input placeholder="e.g. 12 Main Street" value={form.address} onChange={e => update("address", e.target.value)} className="h-11 bg-background border-0 font-medium" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Suburb *</Label>
              <Input placeholder="e.g. Parramatta" value={form.suburb} onChange={e => update("suburb", e.target.value)} className="h-11 bg-background border-0 font-medium" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">State *</Label>
              <Select value={form.state} onValueChange={v => update("state", v)}>
                <SelectTrigger className="h-11 bg-background border-0 font-medium"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Specialties */}
        <div className="rounded-xl bg-secondary/40 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Specialties <span className="font-normal normal-case text-muted-foreground">(select up to 3)</span></p>
          <div className="flex flex-wrap gap-2">
            {SPECIALTY_OPTIONS.map(s => {
              const selected = form.specialties.includes(s);
              const disabled = !selected && form.specialties.length >= 3;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSpecialty(s)}
                  disabled={disabled}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    selected ? "bg-accent text-white border-accent" : disabled ? "bg-secondary/30 text-muted-foreground border-transparent opacity-50 cursor-not-allowed" : "bg-background border-border hover:border-accent/50"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legal waiver */}
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
          <label className="flex gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.legal_accepted}
              onChange={e => update("legal_accepted", e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-amber-600 flex-shrink-0"
            />
            <span className="text-sm text-amber-900 leading-relaxed">
              I confirm I am an authorised representative of this business. I assume full legal liability for the accuracy of the information provided. ServCheck is a neutral directory and is not responsible for customer disputes.
            </span>
          </label>
        </div>

        <Button type="submit" disabled={!isValid || loading} className="w-full h-14 text-base font-heading font-semibold bg-accent text-accent-foreground hover:bg-accent/90">
          {loading ? "Listing your workshop..." : "List My Workshop for Free"}
        </Button>
      </form>
    </div>
  );
}