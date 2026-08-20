import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Upload, CheckCircle, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { getStateConfig } from "../lib/mechanicLicenceConfig";

export default function VerificationUploadTab({ profile, onSubmitted }) {
  const [form, setForm] = useState({
    mvri_licence_number: profile?.mvri_licence_number || "",
    mvri_licence_type: profile?.mvri_licence_type || "",
    utility_bill_url: profile?.utility_bill_url || "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(profile?.otp_verified || false);
  const [uploadingBill, setUploadingBill] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const billInputRef = useRef();

  const stateConfig = getStateConfig(profile?.state);
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

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

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke("sendVerificationOtp", {});
      setOtpSent(true);
      toast.success("Code sent to your email!");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not send code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("verifyMechanicOtp", { otp: otpCode });
      if (res.data?.success) {
        setOtpVerified(true);
        toast.success("Email verified!");
      } else {
        toast.error(res.data?.error || "Incorrect code.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Incorrect code.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!otpVerified) { toast.error("Please verify your email first."); return; }
    if (profile?.mechanic_type === "workshop" && !form.utility_bill_url) {
      toast.error("Please upload a utility bill for your workshop."); return;
    }
    if (profile?.mechanic_type === "mobile_mechanic" && !form.utility_bill_url) {
      toast.error("Please upload a utility bill or driver's licence for address verification."); return;
    }
    setLoading(true);
    try {
      await base44.functions.invoke('updateMyMechanicProfile', {
        profile_id: profile.id,
        updates: {
          mvri_licence_number: form.mvri_licence_number,
          mvri_licence_type: form.mvri_licence_type,
          utility_bill_url: form.utility_bill_url || null,
          verification_status: "pending",
        },
      });
      setSubmitted(true);
      if (onSubmitted) onSubmitted();
    } catch (err) {
      toast.error("Something went wrong: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Just submitted — show confirmation
  if (submitted || profile?.verification_status === "pending") {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 text-center space-y-3">
        <Shield className="h-10 w-10 text-amber-500 mx-auto" />
        <h3 className="font-heading font-bold text-lg">Submitted for Verification</h3>
        <p className="text-sm text-amber-800 leading-relaxed">
          Your documents have been submitted and are now being reviewed by our team. <strong>Please wait up to 8 hours</strong> for initial verification. We'll email you at <strong>{profile?.user_email}</strong> with updates.
        </p>
        <div className="rounded-lg bg-amber-100 p-3 text-xs text-amber-700 text-left space-y-1">
          <p className="font-bold">What happens next:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Our team reviews your licence/certificate and documents</li>
            <li>You'll receive an approval or rejection email within 8 hours</li>
            <li>Once approved, you can immediately unlock and claim leads</li>
            <li>Check your email (including spam folder) for updates</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex gap-3">
        <Shield className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800 space-y-1">
          <p className="font-bold text-blue-900">Verify your credentials — {profile?.state}</p>
          <p>Upload your licence/qualification details below. Once verified, you'll unlock access to live leads. Takes up to <strong>48 hours</strong>.</p>
        </div>
      </div>

      {stateConfig?.infoBox && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex gap-2 text-xs text-amber-800">
          <span className="flex-shrink-0">ℹ️</span>
          <p>{stateConfig.infoBox}</p>
        </div>
      )}

      {/* ABN */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">ABN (Read-only)</Label>
        <div className="h-11 rounded-lg bg-secondary/30 border border-secondary px-3 py-2 flex items-center text-xs text-muted-foreground font-mono">
          {profile?.abn || "—"}
        </div>
        <p className="text-[11px] text-muted-foreground">Your ABN from business registration is used for verification purposes.</p>
      </div>

      {/* Licence number */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">
          {stateConfig?.licenceLabel || "Licence / Certificate Number"}
        </Label>
        <Input
          value={form.mvri_licence_number}
          onChange={e => update("mvri_licence_number", e.target.value)}
          placeholder={stateConfig?.licencePlaceholder || "Enter number"}
          className="h-11 bg-secondary/50 border-0"
        />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {stateConfig?.licenceHint}{" "}
          {stateConfig?.verifyUrl && (
            <a href={stateConfig.verifyUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">
              Check {stateConfig.verifyLabel} →
            </a>
          )}
        </p>
      </div>

      {/* Licence type */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">
          {stateConfig?.requiresLicence ? "Licence Type" : "Qualification Type"}
        </Label>
        <Select value={form.mvri_licence_type} onValueChange={v => update("mvri_licence_type", v)}>
          <SelectTrigger className="h-11 bg-secondary/50 border-0">
            <SelectValue placeholder="Select type…" />
          </SelectTrigger>
          <SelectContent>
            {(stateConfig?.licenceTypes || ["Other"]).map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Address proof — mobile mechanics: utility bill OR driver's licence */}
      {profile?.mechanic_type === "mobile_mechanic" && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Proof of Address *</Label>
          <p className="text-[11px] text-muted-foreground">Upload a recent <strong>utility bill</strong> (electricity, gas, water) <strong>OR</strong> your <strong>driver's licence</strong> showing your residential address.</p>
          {form.utility_bill_url ? (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="text-xs text-emerald-800 font-semibold">Document uploaded</span>
              <button onClick={() => update("utility_bill_url", "")} className="ml-auto text-xs text-muted-foreground hover:text-destructive">Remove</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => billInputRef.current?.click()}
              disabled={uploadingBill}
              className="w-full h-20 rounded-xl border-2 border-dashed border-border bg-secondary/30 flex flex-col items-center justify-center gap-1 hover:border-accent transition-colors text-muted-foreground"
            >
              {uploadingBill ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              <span className="text-xs font-medium">{uploadingBill ? "Uploading…" : "Tap to upload utility bill or driver's licence"}</span>
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

      {/* Utility bill — workshops only */}
      {profile?.mechanic_type === "workshop" && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Proof of Business Address (Utility Bill) *</Label>
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
              className="w-full h-20 rounded-xl border-2 border-dashed border-border bg-secondary/30 flex flex-col items-center justify-center gap-1 hover:border-accent transition-colors text-muted-foreground"
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

      {/* Email OTP */}
      <div className="rounded-xl bg-secondary/50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <MailCheck className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-semibold">Verify your email</p>
          {otpVerified && <span className="ml-auto text-xs font-bold text-emerald-600">✓ Verified</span>}
        </div>
        {!otpVerified && (
          <>
            {!otpSent ? (
              <Button onClick={handleSendOtp} disabled={loading} variant="outline" className="w-full h-10 text-xs font-semibold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send verification code to my email"}
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">Enter the 6-digit code sent to your email.</p>
                <div className="flex gap-2">
                  <Input
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="h-11 bg-white border-0 text-center text-lg font-bold tracking-widest flex-1"
                  />
                  <Button onClick={handleVerifyOtp} disabled={loading || otpCode.length < 6} className="h-11 px-5 bg-accent text-white">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                  </Button>
                </div>
                <button onClick={handleSendOtp} className="text-[11px] text-muted-foreground underline">Resend code</button>
              </div>
            )}
          </>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!otpVerified || loading}
        className="w-full h-12 font-heading font-bold text-sm bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit for Verification"}
      </Button>
    </div>
  );
}