import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { getCredits, syncCreditsFromDB } from "@/lib/credits";
import SubscriptionModal from "./SubscriptionModal";
import { toast } from "sonner";

export default function CreditsBar() {
  const [credits, setCredits] = useState(getCredits());
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Always sync from DB on mount to get accurate balance
    syncCreditsFromDB().then(c => setCredits(c));

    const refresh = () => setCredits(getCredits());
    window.addEventListener("credits-updated", refresh);

    // Handle return from Stripe — wait for webhook then re-sync
    const params = new URLSearchParams(window.location.search);
    const purchased = params.get("credits_purchased");
    if (purchased) {
      window.history.replaceState({}, '', window.location.pathname);
      let attempts = 0;
      const poll = async () => {
        attempts++;
        const newCredits = await syncCreditsFromDB();
        setCredits(newCredits);
        if (attempts < 5) setTimeout(poll, 3000);
        else toast.success("Credits added to your account!");
      };
      setTimeout(poll, 2000);
    }

    return () => window.removeEventListener("credits-updated", refresh);
  }, []);

  const handleSuccess = (addedCredits) => {
    setCredits(getCredits());
    setShowModal(false);
    toast.success(`${addedCredits} credits added!`);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors"
      >
        <Zap className="h-3.5 w-3.5 text-[#f97316]" />
        <span className="text-xs font-bold text-[#f97316]">{credits} credits</span>
      </button>

      {showModal && (
        <SubscriptionModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}