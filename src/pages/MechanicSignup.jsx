import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wrench, Car, CheckCircle, ArrowLeft, Upload, Shield, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import SEOHead from "../components/SEOHead";
import { getStateConfig } from "../lib/mechanicLicenceConfig";

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
const DEFAULT_SPECIALTIES = [
  "Logbook Service", "Brake Repairs", "Engine Diagnostics", "Suspension & Steering",
  "Electrical", "Air Conditioning", "Transmission", "Exhaust", "Tyres & Wheels",
  "Pre-Purchase Inspections", "4WD Specialist", "EV / Hybrid", "Fleet", "European Cars"
];

export default function MechanicSignup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(location.state?.mechanic_type ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    mechanic_type: location.state?.mechanic_type || "",
    business_name: "",
    abn: "",
    phone: "",
    address: "",
    suburb: "",
    postcode: "",
    state: "",
    bio: "",
    specialties: [],
    mvri_licence_number: "",
    mvri_licence_type: "",
    utility_bill_url: "",
  });

  const [uploadingBill, setUploadingBill] = useState(false);
  const [customSpecialty, setCustomSpecialty] = useState("");
  const billInputRef = useRef();

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleSpecialty = (s) => {
    setForm(p => ({
      ...p,
      specialties: p.specialties.includes(s)
        ? p.specialties.filter(x => x !== s)
        : [...p.specialties, s]
    }));
  };

  const handleUploadBill = async (file) => {
    setUploadingBill(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      update("utility_bill_url", file_uri);
      toast.success("Utility bill uploaded.");
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setUploadingBill(false);
    }
  };



  const handleSubmit = async () => {
    if (form.mechanic_type === "workshop" && !form.utility_bill_url) { toast.error("Please upload a utility bill."); return; }
    setLoading(true);
    try {
      const user = await base44.auth.me();
      if (!user) { base44.auth.redirectToLogin(window.location.href); return; }
      const existing = await base44.entities.MechanicProfile.filter({ user_email: user.email });
      if (existing.length === 0) {
        await base44.functions.invoke('createMechanicProfile', { ...form });
      } else {
        await base44.functions.invoke('updateMyMechanicProfile', {
          profile_id: existing[0].id,
          updates: { ...form, verification_status: "pending" },
        });
      }
      await base44.functions.invoke('setUserRole', { role: form.mechanic_type === 'mobile_mechanic' ? 'mobile_mechanic' : 'mechanic' });
      await refreshUser();
      setStep(4);
    } catch (err) {
      toast.error("Something went wrong: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Next = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      if (!user) { base44.auth.redirectToLogin(window.location.href); return; }
      await base44.functions.invoke('createMechanicProfile', { ...form });
      setStep(3);
    } catch (err) {
      toast.error("Something went wrong: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isMobile = form.mechanic_type === "mobile_mechanic";
  const isStep2Valid = form.business_name && form.abn && form.phone && form.suburb && form.postcode && form.state && (isMobile || form.address);

  // Already a mechanic with a profile — redirect straight to portal
  // Do NOT redirect role:'user' away — new accounts start as 'user' before setUserRole is called
  useEffect(() => {
    if (!user) { setChecking(false); return; }
    if (user.role === 'mechanic' || user.role === 'mobile_mechanic') {
      base44.entities.MechanicProfile.filter({ user_email: user.email }).then(profiles => {
        if (profiles.length > 0) {
          navigate('/mechanic-portal', { replace: true });
        } else {
          setChecking(false);
        }
      });
    } else {
      setChecking(false);
    }
  }, [user]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#f97316] rounded-full animate-spin" />
      </div>
    );
  }

  // Guest wall — prompt to sign up / log in first
  if (!user) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="h-16 w-16 rounded-2xl bg-[#1a237e] flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Wrench className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-[#1a237e] mb-2">List Your Business</h1>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">Create a free account to list your mobile mechanic or workshop on ServCheck and start receiving leads.</p>

          <button
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="w-full py-3.5 rounded-2xl bg-[#f97316] hover:bg-[#ea6c0a] text-white font-heading font-bold text-base shadow-lg shadow-orange-200 transition-colors mb-4"
          >
            Create Free Account
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">Already have an account?</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="w-full py-3 rounded-2xl border-2 border-[#1a237e] text-[#1a237e] font-heading font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Log in to my account
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <SEOHead
        title="Register Your Mechanic Business | ServCheck Partner Program"
        description="Get more customers by joining ServCheck. Receive qualified leads from local car owners searching for trusted mechanics in your area."
        path="/mechanic-signup"
      />

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl">List Your Business</h1>
            <p className="text-muted-foreground text-sm">Join ServCheck as a mechanic</p>
          </div>
        </div>
      </motion.div>

      {/* Step 1: Choose type */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="font-semibold text-sm text-foreground mb-4">What type of mechanic are you?</p>
          <button
            onClick={() => { update("mechanic_type", "mobile_mechanic"); setStep(2); }}
            className="w-full rounded-xl border-2 border-border bg-card p-5 text-left hover:border-accent transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-heading font-bold">Mobile Mechanic</p>
                <p className="text-sm text-muted-foreground">I travel to the customer's location</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => { update("mechanic_type", "workshop"); setStep(2); }}
            className="w-full rounded-xl border-2 border-border bg-card p-5 text-left hover:border-accent transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <Wrench className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="font-heading font-bold">Workshop / Garage</p>
                <p className="text-sm text-muted-foreground">Customers come to my premises</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (() => {
        const isMobile = form.mechanic_type === "mobile_mechanic";
        return (
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setStep(1)} className="text-xs text-muted-foreground hover:text-foreground">← Change type</button>
            <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground font-medium">
              {form.mechanic_type === "mobile_mechanic" ? "Mobile Mechanic" : "Workshop"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Business Name *</Label>
              <Input value={form.business_name} onChange={e => update("business_name", e.target.value)} placeholder="e.g. Mike's Mobile Mechanic" className="h-11 bg-secondary/50 border-0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">ABN *</Label>
              <Input value={form.abn} onChange={e => update("abn", e.target.value)} placeholder="11 digit ABN" className="h-11 bg-secondary/50 border-0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Phone *</Label>
              <Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="04XX XXX XXX" className="h-11 bg-secondary/50 border-0" />
            </div>
            {/* Workshop needs full address; mobile mechanic only needs suburb */}
            {!isMobile && (
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Street Address *</Label>
                <Input value={form.address} onChange={e => update("address", e.target.value)} placeholder="123 Main St" className="h-11 bg-secondary/50 border-0" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Suburb *</Label>
              <Input value={form.suburb} onChange={e => update("suburb", e.target.value)} placeholder="e.g. Parramatta" className="h-11 bg-secondary/50 border-0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Postcode *</Label>
              <Input value={form.postcode} onChange={e => update("postcode", e.target.value)} placeholder="e.g. 2150" maxLength={4} className="h-11 bg-secondary/50 border-0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">State *</Label>
              <Select value={form.state} onValueChange={v => update("state", v)}>
                <SelectTrigger className="h-11 bg-secondary/50 border-0"><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">About Your Business</Label>
              <textarea
                value={form.bio}
                onChange={e => update("bio", e.target.value)}
                placeholder="Tell customers what makes your service great..."
                rows={3}
                className="w-full rounded-lg bg-secondary/50 border-0 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground">Specialties</Label>
            <div className="flex flex-wrap gap-2">
              {[...DEFAULT_SPECIALTIES, ...form.specialties.filter(s => !DEFAULT_SPECIALTIES.includes(s))].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSpecialty(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all font-semibold ${
                    form.specialties.includes(s)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white border-slate-300 text-foreground hover:border-primary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {/* Add custom specialty */}
            <div className="flex gap-2 mt-1">
              <Input
                value={customSpecialty}
                onChange={e => setCustomSpecialty(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && customSpecialty.trim()) {
                    e.preventDefault();
                    const val = customSpecialty.trim();
                    if (!form.specialties.includes(val)) toggleSpecialty(val);
                    setCustomSpecialty("");
                  }
                }}
                placeholder="Add your own specialty…"
                className="h-9 text-xs bg-secondary/50 border-0 flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  const val = customSpecialty.trim();
                  if (val && !form.specialties.includes(val)) toggleSpecialty(val);
                  setCustomSpecialty("");
                }}
                disabled={!customSpecialty.trim()}
                className="text-xs px-3 py-1.5 rounded-full border border-primary text-primary font-semibold hover:bg-primary/5 disabled:opacity-40 transition-colors"
              >
                + Add
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 space-y-1">
            <p className="font-bold text-emerald-900">🎉 10 free lead unlocks on signup!</p>
            <p>Every new mechanic gets 10 free lead unlocks per month to get started. After that:</p>
            <ul className="list-disc pl-4 space-y-0.5 mt-1">
              <li><strong>Starter — $29.99/mo:</strong> Unlimited leads (after Featured mechanics get first look in your area)</li>
              <li><strong>Featured — $49.99/mo:</strong> 3-minute exclusive first look on every new lead before other mechanics see it</li>
            </ul>
          </div>

          {/* Mobile mechanic — service radius */}
          {isMobile && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Service Radius (km)</Label>
              <Input
                type="number"
                value={form.service_radius_km || ""}
                onChange={e => update("service_radius_km", e.target.value ? Number(e.target.value) : "")}
                placeholder="e.g. 25"
                className="h-11 bg-secondary/50 border-0"
              />
              <p className="text-[11px] text-muted-foreground">How far are you willing to travel from your suburb?</p>
            </div>
          )}

          <Button
            onClick={handleStep2Next}
            disabled={!isStep2Valid || loading}
            className="w-full h-12 font-heading font-bold text-sm bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Next: Identity Verification →"}
          </Button>
        </div>
        );
      })()}

      {/* Step 3: Verification */}
      {step === 3 && (() => {
        const stateConfig = getStateConfig(form.state);
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <button onClick={() => setStep(2)} className="text-sm font-medium text-foreground hover:text-accent flex items-center gap-1">← Back to details</button>

            <div className="text-center space-y-2">
              <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mx-auto">
                <Shield className="h-7 w-7 text-primary-foreground" />
              </div>
              <h2 className="font-heading font-bold text-xl">Verify Your Credentials</h2>
              <p className="text-sm text-muted-foreground">We review all mechanics before they appear on ServCheck. This typically takes up to <strong>48 hours</strong>.</p>
            </div>

            {stateConfig?.infoBox && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex gap-2 text-xs text-amber-800">
                <span className="flex-shrink-0 mt-0.5">ℹ️</span>
                <p>{stateConfig.infoBox}</p>
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  {stateConfig?.licenceLabel || "Licence / Certificate Number"} *
                </Label>
                <Input
                  value={form.mvri_licence_number}
                  onChange={e => update("mvri_licence_number", e.target.value)}
                  placeholder={stateConfig?.licencePlaceholder || "Enter number"}
                  className="h-12 bg-white border border-slate-200 shadow-sm"
                />
                {(stateConfig?.licenceHint || stateConfig?.verifyUrl) && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {stateConfig?.licenceHint}{" "}
                    {stateConfig?.verifyUrl && (
                      <a href={stateConfig.verifyUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 font-medium">
                        Check {stateConfig.verifyLabel} →
                      </a>
                    )}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  {stateConfig?.requiresLicence ? "Licence Type *" : "Qualification Type *"}
                </Label>
                <Select value={form.mvri_licence_type} onValueChange={v => update("mvri_licence_type", v)}>
                  <SelectTrigger className="h-12 bg-white border border-slate-200 shadow-sm">
                    <SelectValue placeholder={stateConfig?.requiresLicence ? "Select licence type…" : "Select qualification type…"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(stateConfig?.licenceTypes || ["Other"]).map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.mechanic_type === "workshop" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Proof of Business Address (Utility Bill) *</Label>
                  <p className="text-[11px] text-muted-foreground">Upload a recent electricity, gas, or water bill showing your workshop address.</p>
                  {form.utility_bill_url ? (
                    <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                      <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-xs text-emerald-800 font-semibold">Utility bill uploaded</span>
                      <button onClick={() => update("utility_bill_url", "")} className="ml-auto text-xs text-muted-foreground hover:text-destructive">Remove</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => billInputRef.current?.click()}
                      disabled={uploadingBill}
                      className="w-full h-20 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center gap-1 hover:border-accent transition-colors text-slate-500"
                    >
                      {uploadingBill ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                      <span className="text-xs font-medium">{uploadingBill ? "Uploading…" : "Tap to upload utility bill"}</span>
                    </button>
                  )}
                  <input
                    ref={billInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={e => { if (e.target.files[0]) handleUploadBill(e.target.files[0]); }}
                  />
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-12 font-heading font-bold text-sm bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit for Verification"}
            </Button>
          </motion.div>
        );
      })()}

      {/* Step 4: Pending review */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-12">
          <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
            <Shield className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-2xl mb-3">Application Submitted!</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Thank you for registering with ServCheck. We're reviewing your information and verifying your credentials. This typically takes up to <strong>48 hours</strong>.
            </p>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              You'll receive an email confirmation at <strong>{user?.email}</strong> once your account is approved. Until then, you can access your dashboard but won't be able to claim leads.
            </p>
          </div>
          <Button onClick={() => navigate('/mechanic-portal')} className="bg-accent text-accent-foreground hover:bg-accent/90 font-heading font-semibold h-11">
            Go to Dashboard
          </Button>
        </motion.div>
      )}
    </div>
  );
}