import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Building2, MapPin, Phone, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function DealerRecommendations({ state, suburb, carMake }) {
  const [dealers, setDealers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!state) return;
    const load = async () => {
      // Prefer same state, filter by specialty if make provided
      const all = await base44.entities.DealerProfile.filter({ state, is_active: true });
      const verified = all.filter(d => d.is_verified);
      // Sort: same suburb first, then rest
      const sorted = verified.sort((a, b) => {
        if (a.suburb === suburb && b.suburb !== suburb) return -1;
        if (b.suburb === suburb && a.suburb !== suburb) return 1;
        return 0;
      });
      setDealers(sorted.slice(0, 3));
    };
    load();
  }, [state, suburb]);

  if (dealers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <Building2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="font-heading font-bold text-sm">Verified Dealers Nearby</p>
          <p className="text-xs text-muted-foreground">These verified dealerships may offer a better price for {carMake || "your vehicle"}</p>
        </div>
      </div>

      <div className="space-y-3">
        {dealers.map((dealer) => (
          <div key={dealer.id} className="bg-white rounded-xl border border-border p-4 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-sm truncate">{dealer.business_name}</p>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold flex-shrink-0">✓ Verified</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <p className="text-xs text-muted-foreground truncate">{dealer.suburb}, {dealer.state}</p>
              </div>
              {dealer.specialties?.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1 truncate">Brands: {dealer.specialties.slice(0, 3).join(", ")}</p>
              )}
            </div>
            {dealer.phone && (
              <a href={`tel:${dealer.phone}`} className="flex-shrink-0">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                  <Phone className="h-3 w-3" /> Call
                </Button>
              </a>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        These are verified dealers registered on ServCheck — not paid ads.
      </p>
    </motion.div>
  );
}