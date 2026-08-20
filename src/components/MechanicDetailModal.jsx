import { X, FileText, ExternalLink, MapPin, Phone, Briefcase, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStateConfig } from "@/lib/mechanicLicenceConfig";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function MechanicDetailModal({ profile, onClose }) {
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [loading, setLoading] = useState(false);
  const [docLoading, setDocLoading] = useState(false);

  const openDoc = async () => {
    setDocLoading(true);
    try {
      const res = await base44.functions.invoke("getVerificationDocUrl", { profile_id: profile.id });
      if (res.data?.url) window.open(res.data.url, "_blank", "noopener");
    } finally {
      setDocLoading(false);
    }
  };

  useEffect(() => {
    if (!profile?.id) return;
    setLoading(true);
    base44.entities.MechanicProfile.get(profile.id).then(fresh => {
      if (fresh) setCurrentProfile(fresh);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [profile?.id]);

  if (!currentProfile) return null;
  const p = currentProfile;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border flex items-center justify-between p-6 rounded-t-2xl">
          <div>
            <h2 className="font-heading font-bold text-xl">{p.business_name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {p.mechanic_type === "mobile_mechanic" ? "📍 Mobile Mechanic" : "🔧 Workshop"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <Badge
            className={
              p.verification_status === "verified"
                ? "bg-emerald-100 text-emerald-800 border-emerald-200 self-start"
                : p.verification_status === "rejected"
                ? "bg-red-100 text-red-800 border-red-200 self-start"
                : "bg-amber-100 text-amber-800 border-amber-200 self-start"
            }
          >
            {p.verification_status}
          </Badge>

          {/* Contact Information */}
          <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex gap-2">
                <span className="text-muted-foreground">Email:</span>
                <a href={`mailto:${p.user_email}`} className="text-accent hover:underline">
                  {p.user_email}
                </a>
              </div>
              <div className="flex gap-2">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-mono">{p.phone || "—"}</span>
              </div>
              <div className="flex gap-2 col-span-1 sm:col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>
                  {p.address}, {p.suburb}, {p.state}
                </span>
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm">Business Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">ABN:</span>
                <p className="font-semibold font-mono mt-0.5">{p.abn || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Business Type:</span>
                <p className="font-semibold mt-0.5">
                  {p.mechanic_type === "mobile_mechanic" ? "Mobile Mechanic" : "Workshop"}
                </p>
              </div>
              {p.bio && (
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-muted-foreground">About:</span>
                  <p className="mt-0.5">{p.bio}</p>
                </div>
              )}
              {p.specialties && p.specialties.length > 0 && (
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-muted-foreground block mb-1.5">Specialties:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {p.specialties.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {(!p.specialties || p.specialties.length === 0) && (
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-muted-foreground block mb-1.5">Specialties:</span>
                  <span className="text-xs text-muted-foreground italic">None specified</span>
                </div>
              )}
            </div>
          </div>

          {/* Verification Details */}
          <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm">Verification Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">
                  {getStateConfig(p.state)?.licenceLabel || "Licence Number"}:
                </span>
                <p className="font-semibold font-mono mt-0.5">{p.mvri_licence_number || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Licence Type:</span>
                <p className="font-semibold mt-0.5">{p.mvri_licence_type || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email OTP:</span>
                <p className={`font-semibold mt-0.5 ${p.otp_verified ? "text-emerald-600" : "text-red-600"}`}>
                  {p.otp_verified ? "✓ Verified" : "✗ Not verified"}
                </p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm">Documents</h3>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <div className="space-y-2">
                {p.mechanic_type === "workshop" && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Proof of Business Address:</p>
                    {p.utility_bill_url ? (
                      <button
                        type="button"
                        onClick={openDoc}
                        disabled={docLoading}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-100/50 hover:bg-blue-100 text-blue-700 font-semibold text-sm transition-colors disabled:opacity-50"
                      >
                        {docLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        View Utility Bill
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <p className="text-sm text-red-600 font-semibold">⚠️ Not uploaded</p>
                    )}
                  </div>
                )}
                {(() => {
                  const cfg = getStateConfig(p.state);
                  return cfg?.verifyUrl ? (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Licence Verification:</p>
                      <a
                        href={cfg.verifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-100/50 hover:bg-purple-100 text-purple-700 font-semibold text-sm transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Check on {cfg.verifyLabel}
                      </a>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          {/* Admin Notes */}
          {p.verification_notes && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Admin Notes:</p>
                  <p className="text-xs text-amber-700 mt-1">{p.verification_notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-muted-foreground">
            <p>Created: {p.created_date ? new Date(p.created_date).toLocaleDateString() : "—"}</p>
            <p>Mechanic ID: {p.mechanic_id || "—"}</p>
          </div>
        </div>

        {/* Close Button */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex justify-end rounded-b-2xl">
          <Button variant="outline" onClick={onClose} className="gap-2">
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}