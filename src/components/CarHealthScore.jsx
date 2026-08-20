import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import { calculateCarHealthScore } from "@/lib/carHealthScore";
import VehicleHealthCard from "@/components/VehicleHealthCard";

const norm = (s) => (s || "").trim().toLowerCase();

export default function CarHealthScore({ userId }) {
  const [vehicles, setVehicles] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profiles, logbookEntries, quoteChecks] = await Promise.all([
          base44.entities.CarProfile.list("-created_date", 10),
          base44.entities.LogbookEntry.list("-service_date", 100),
          base44.entities.QuoteCheck.list("-created_date", 50),
        ]);

        if (!profiles || profiles.length === 0) {
          setVehicles([]);
          return;
        }

        const cards = profiles.map((p) => {
          const entries = logbookEntries.filter(
            (e) => norm(e.car_make) === norm(p.car_make) && norm(e.car_model) === norm(p.car_model)
          );
          const quotes = quoteChecks.filter(
            (q) => norm(q.car_make) === norm(p.car_make) && norm(q.car_model) === norm(p.car_model)
          );
          const { score, biggestFactor, factors } = calculateCarHealthScore(
            entries,
            quotes,
            p.last_odometer || null
          );
          return {
            id: p.id,
            name: `${p.car_year} ${p.car_make} ${p.car_model}`,
            score,
            biggestFactor,
            factors,
          };
        });

        setVehicles(cards);
      } catch (err) {
        console.error("CarHealthScore fetch error:", err);
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-5 border border-slate-200 flex items-center justify-center h-32">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) return null;

  return (
    <div className="space-y-3">
      {vehicles.map((v) => (
        <VehicleHealthCard
          key={v.id}
          vehicleName={v.name}
          score={v.score}
          biggestFactor={v.biggestFactor}
          factors={v.factors}
        />
      ))}
    </div>
  );
}