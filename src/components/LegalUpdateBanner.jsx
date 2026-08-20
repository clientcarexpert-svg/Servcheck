import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TERMS_VERSION, PRIVACY_POLICY_VERSION } from "@/lib/legalVersions";

const DISMISS_KEY = `legal_accepted_${TERMS_VERSION}_${PRIVACY_POLICY_VERSION}`;

export default function LegalUpdateBanner({ user }) {
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || localStorage.getItem(DISMISS_KEY)) return;
    base44.entities.UserAcceptances.filter({ user_email: user.email }, undefined, 1)
      .then((recs) => {
        const rec = recs[0];
        if (rec && rec.terms_version === TERMS_VERSION && rec.privacy_policy_version === PRIVACY_POLICY_VERSION) {
          localStorage.setItem(DISMISS_KEY, "1");
        } else {
          setShow(true);
        }
      })
      .catch(() => {});
  }, [user]);

  const handleAccept = async () => {
    if (!checked) return;
    setSaving(true);
    try {
      await base44.functions.invoke("recordUserAcceptances", {
        privacy_policy_accepted: true,
        terms_accepted: true,
        privacy_policy_version: PRIVACY_POLICY_VERSION,
        terms_version: TERMS_VERSION,
      });
      localStorage.setItem(DISMISS_KEY, "1");
      setShow(false);
      toast.success("Thanks — your acceptance has been recorded.");
    } catch {
      toast.error("Failed to record acceptance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 110 }} className="bg-[#0B1120] text-white px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1">
          <ShieldCheck className="h-5 w-5 text-[#f97316] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold mb-1">We've updated our legal documents</p>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-0.5 flex-shrink-0 accent-orange-500"
              />
              <span className="text-xs text-slate-300">
                I agree to the{" "}
                <Link to="/terms" target="_blank" className="text-[#f97316] underline font-semibold">Terms of Service</Link>
                {" "}and{" "}
                <Link to="/privacy" target="_blank" className="text-[#f97316] underline font-semibold">Privacy Policy</Link>
              </span>
            </label>
          </div>
        </div>
        <Button
          onClick={handleAccept}
          disabled={!checked || saving}
          className="bg-[#f97316] hover:bg-[#ea6c0a] text-white font-bold h-10 px-6 flex-shrink-0"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept"}
        </Button>
      </div>
    </div>
  );
}