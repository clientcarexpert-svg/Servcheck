import { useState, useEffect } from "react";
import SEOHead from "../components/SEOHead";
import SubscriptionModal from "@/components/SubscriptionModal";
import PremiumGate from "@/components/PremiumGate";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import CarAnalysisLoader from "@/components/CarAnalysisLoader";
import BuyCarForm from "@/components/BuyCar/BuyCarForm";
import BuyCarResult from "@/components/BuyCar/BuyCarResult";

export default function BuyCar() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => { setCurrentUser(u); setUserLoading(false); }).catch(() => setUserLoading(false));
  }, []);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [form, setForm] = useState({});

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    setResult(null);
    setForm(formData);

    try {
      // The whole analysis (credit deduction, caching, AI analysis, saving,
      // and refund-on-failure) runs server-side for reliability.
      const res = await base44.functions.invoke("analyseUsedCar", formData);
      if (res.data?.credits != null) {
        localStorage.setItem("servcheck_credits", String(res.data.credits));
        window.dispatchEvent(new Event("credits-updated"));
      }
      setResult(res.data.result);
    } catch (err) {
      const d = err?.response?.data;
      if (d?.insufficient_credits) {
        setShowPaywall(true);
      } else {
        toast.error(d?.refunded
          ? "Analysis failed. Your credits have been refunded. Please try again."
          : "Analysis failed. Please try again.");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <SEOHead
          title="Buy a Used Car Safely — Check Before You Pay | ServCheck"
          description="Get a pre-purchase inspection estimate and valuation guide before buying a used car in Australia. Don't get caught out."
          path="/buy-car"
        />
        <CarAnalysisLoader make={form.car_make} model={form.car_model} year={form.car_year} />
      </div>
    );
  }

  if (result) {
    return (
      <>
        {showPaywall && (
          <SubscriptionModal
            onClose={() => setShowPaywall(false)}
            onSuccess={(c) => { setShowPaywall(false); toast.success(`${c} credits added!`); }}
          />
        )}
        <SEOHead
          title="Buy a Used Car Safely — Check Before You Pay | ServCheck"
          description="Get a pre-purchase inspection estimate and valuation guide before buying a used car in Australia. Don't get caught out."
          path="/buy-car"
        />
        <BuyCarResult 
          result={result} 
          form={form} 
          onCheckAnother={() => { setResult(null); setForm({}); }}
        />
      </>
    );
  }

  return (
    <>
      <SEOHead
        title="Buy a Used Car Safely — Check Before You Pay | ServCheck"
        description="Get a pre-purchase inspection estimate and valuation guide before buying a used car in Australia. Don't get caught out."
        path="/buy-car"
      />
      {showPaywall && (
        <SubscriptionModal
          onClose={() => setShowPaywall(false)}
          onSuccess={(c) => { setShowPaywall(false); toast.success(`${c} credits added!`); }}
        />
      )}
      {userLoading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#f97316] rounded-full animate-spin" />
        </div>
      ) : (
        <PremiumGate user={currentUser}>
          <BuyCarForm 
            onSubmit={handleFormSubmit}
            onReset={() => setForm({})}
          />
        </PremiumGate>
      )}
    </>
  );
}