import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function MultiVehicleGate({ children, onPassed }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [carCount, setCarCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCarCount = async () => {
      try {
        const entries = await base44.entities.LogbookEntry.filter({}, "-service_date", 1000);
        
        // Count unique cars (make+model+year combo)
        const uniqueCars = new Set();
        entries.forEach(e => {
          uniqueCars.add(`${e.car_make}|${e.car_model}|${e.car_year}`);
        });
        
        setCarCount(uniqueCars.size);
      } catch (err) {
        console.error("Failed to count cars:", err);
      } finally {
        setLoading(false);
      }
    };

    checkCarCount();
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  }

  // Free tier can have 1 car; if they have 1 and try to add another, show paywall
  if (carCount >= 1 && !user?.is_premium) {
    return (
      <div className="p-6 space-y-4">
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-heading font-bold text-amber-900">Premium Feature</p>
              <p className="text-sm text-amber-700 mt-1">
                Your free account includes 1 car logbook. Upgrade to Premium to track unlimited vehicles.
              </p>
            </div>
          </div>
          <Button
            onClick={() => window.dispatchEvent(new CustomEvent("open-subscription"))}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            Upgrade to Premium
          </Button>
        </div>
      </div>
    );
  }

  // Pass through if premium or under limit
  if (onPassed) onPassed();
  return <>{children}</>;
}