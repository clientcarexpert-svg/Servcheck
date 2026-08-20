import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, ExternalLink, Shield, Loader2, FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import { getStateConfig } from "@/lib/mechanicLicenceConfig";
import MechanicDetailModal from "./MechanicDetailModal";

export default function MechanicVerificationQueue() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [notes, setNotes] = useState({});
  const [filter, setFilter] = useState("pending");
  const [selectedProfile, setSelectedProfile] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.MechanicProfile.list("-created_date", 200);
      setProfiles(all);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (profileId, action) => {
    setActionLoading(profileId + action);
    try {
      const res = await base44.functions.invoke("approveMechanicVerification", {
        profile_id: profileId,
        action,
        notes: notes[profileId] || "",
      });
      if (res.data?.success) {
        toast.success(action === "approve" ? "Mechanic approved & notified." : "Mechanic rejected & notified.");
        await load();
        setNotes(n => ({ ...n, [profileId]: "" }));
      } else {
        toast.error(res.data?.error || "Action failed.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Something went wrong.");
    } finally {
      setActionLoading(null);
    }
  };

  const [docLoading, setDocLoading] = useState(null);
  const openDoc = async (profileId) => {
    setDocLoading(profileId);
    try {
      const res = await base44.functions.invoke("getVerificationDocUrl", { profile_id: profileId });
      if (res.data?.url) window.open(res.data.url, "_blank", "noopener");
      else toast.error(res.data?.error || "Could not open document.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not open document.");
    } finally {
      setDocLoading(null);
    }
  };

  const filtered = profiles.filter(p =>
    filter === "all" ? true : p.verification_status === filter
  );

  const counts = {
    pending: profiles.filter(p => p.verification_status === "pending").length,
    verified: profiles.filter(p => p.verification_status === "verified").length,
    rejected: profiles.filter(p => p.verification_status === "rejected").length,
  };

  return (
    <div className="space-y-4">
      {selectedProfile && (
        <MechanicDetailModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" /> Mechanic Verification Queue
        </h2>
        <div className="flex gap-2 ml-auto">
          {["pending", "verified", "rejected", "all"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== "all" && counts[f] > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  f === "pending" ? "bg-amber-500 text-white" : f === "verified" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                }`}>{counts[f]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No {filter === "all" ? "" : filter} applications.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
              {/* Header with View Details Button */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-heading font-bold text-sm">{p.business_name}</p>
                  <p className="text-xs text-muted-foreground">{p.user_email} · {p.suburb}, {p.state}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.mechanic_type === "mobile_mechanic" ? "📍 Mobile Mechanic" : "🔧 Workshop"}
                  </p>
                </div>
                <div className="flex gap-2 items-start flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedProfile(p)}
                    className="gap-1.5 h-8 px-2 text-xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Details
                  </Button>
                  <Badge className={
                    p.verification_status === "verified" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                    p.verification_status === "rejected" ? "bg-red-100 text-red-800 border-red-200" :
                    "bg-amber-100 text-amber-800 border-amber-200"
                  }>
                    {p.verification_status}
                  </Badge>
                </div>
              </div>

              {/* Licence details */}
              <div className="rounded-lg bg-secondary/50 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">{getStateConfig(p.state)?.licenceLabel || "Licence No."}: </span>
                  <span className="font-bold">{p.mvri_licence_number || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type: </span>
                  <span className="font-semibold">{p.mvri_licence_type || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">ABN: </span>
                  <span className="font-semibold">{p.abn || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email OTP: </span>
                  <span className={p.otp_verified ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>
                    {p.otp_verified ? "✓ Verified" : "✗ Not verified"}
                  </span>
                </div>
              </div>

              {/* Verify link — state-aware */}
              {(() => {
                const cfg = getStateConfig(p.state);
                return cfg?.verifyUrl ? (
                  <a
                    href={cfg.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Check on {cfg.verifyLabel}
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground italic">NT — no licence register required</span>
                );
              })()}

              {/* Utility bill — served via short-lived signed URL (private storage) */}
              {p.utility_bill_url && (
                <button
                  type="button"
                  onClick={() => openDoc(p.id)}
                  disabled={docLoading === p.id}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline ml-4 disabled:opacity-50"
                >
                  {docLoading === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                  View utility bill
                </button>
              )}

              {/* Notes + actions — pending only */}
              {p.verification_status === "pending" && (
                <div className="space-y-2 pt-1 border-t border-border">
                  <textarea
                    value={notes[p.id] || ""}
                    onChange={e => setNotes(n => ({ ...n, [p.id]: e.target.value }))}
                    placeholder="Optional notes (shown to mechanic if rejected)…"
                    rows={2}
                    className="w-full text-xs rounded-lg bg-secondary/50 border-0 px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction(p.id, "approve")}
                      disabled={actionLoading === p.id + "approve"}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs font-bold gap-1.5"
                    >
                      {actionLoading === p.id + "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(p.id, "reject")}
                      disabled={actionLoading === p.id + "reject"}
                      className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/5 h-9 text-xs font-bold gap-1.5"
                    >
                      {actionLoading === p.id + "reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {/* Show notes if already reviewed */}
              {p.verification_notes && p.verification_status !== "pending" && (
                <p className="text-xs text-muted-foreground italic">Notes: {p.verification_notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}