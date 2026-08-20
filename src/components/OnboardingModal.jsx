import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function OnboardingModal({ onAccept, onCancel }) {
  const handleAgree = async () => {
    await base44.auth.updateMe({ terms_accepted: true });
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-foreground p-6 text-center">
          <div className="h-14 w-14 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-3">
            <Shield className="h-7 w-7 text-accent" />
          </div>
          <h2 className="font-heading font-bold text-xl text-white">Welcome to ServCheck</h2>
          <p className="text-white/60 text-sm mt-1">Please review our terms before continuing</p>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-foreground leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="#" className="text-accent underline font-medium">Terms of Service</a>{" "}and{" "}
            <a href="#" className="text-accent underline font-medium">Privacy Policy</a>.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ServCheck provides <strong>price estimates only</strong> and does not provide financial or legal advice.
            All results are AI-generated for informational purposes only. ServCheck carries no liability for
            disputes between consumers and automotive businesses.
          </p>
          <p className="text-xs text-muted-foreground">
            We collect anonymised quote data to improve pricing accuracy. No personal information is sold to third parties.
          </p>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-12 font-heading font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAgree}
            className="flex-1 h-12 bg-accent text-accent-foreground font-heading font-semibold"
          >
            Agree &amp; Continue
          </Button>
        </div>
      </div>
    </div>
  );
}