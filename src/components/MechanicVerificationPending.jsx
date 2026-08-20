import { Shield, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function MechanicVerificationPending({ profile }) {
  const isRejected = profile?.verification_status === "rejected";

  return (
    <div className="max-w-sm mx-auto px-6 py-20 text-center space-y-5">
      <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto ${isRejected ? "bg-red-100" : "bg-amber-100"}`}>
        {isRejected
          ? <XCircle className="h-8 w-8 text-red-500" />
          : <Clock className="h-8 w-8 text-amber-600" />
        }
      </div>

      <div>
        <h2 className="font-heading font-bold text-xl">
          {isRejected ? "Verification Unsuccessful" : "Verification Pending"}
        </h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          {isRejected
            ? <>Your application was not approved. {profile?.verification_notes && <><br /><span className="italic">"{profile.verification_notes}"</span></>}<br /><br />Please contact <a href="mailto:support@servcheck.com.au" className="underline text-blue-600">support@servcheck.com.au</a> if you believe this is an error.</>
            : <>Your MVRI licence {profile?.mechanic_type === "workshop" ? "and utility bill are" : "is"} being reviewed by our team. This takes up to <strong>48 hours</strong>. You'll receive an email at <strong>{profile?.user_email}</strong> once approved.</>
          }
        </p>
      </div>

      {isRejected && (
        <Button
          variant="outline"
          onClick={() => base44.auth.logout("/")}
          className="font-semibold"
        >
          Log Out
        </Button>
      )}

      {!isRejected && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 text-left space-y-1">
          <p className="font-bold">While you wait:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Make sure your MVRI licence is current</li>
            <li>Check your email (including spam)</li>
            <li>Contact support if it's been over 48 hours</li>
          </ul>
        </div>
      )}
    </div>
  );
}