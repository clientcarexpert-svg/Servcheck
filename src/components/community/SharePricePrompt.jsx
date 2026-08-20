import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SharePricePrompt({ entry, onDismiss }) {
  const navigate = useNavigate();
  if (!entry?.cost || !entry?.service_type) return null;

  const handleShare = () => {
    const params = new URLSearchParams({
      share: "1",
      make: entry.car_make || "",
      model: entry.car_model || "",
      year: entry.car_year || "",
      service: entry.service_type || "",
      price: String(entry.cost || ""),
      state: entry.state || "",
    });
    navigate(`/community?${params.toString()}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-accent/30 bg-accent/5 p-4 flex items-start gap-3"
    >
      <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
        <Users className="h-5 w-5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-sm">Help other drivers — share what you paid</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Post your ${entry.cost?.toLocaleString()} {entry.service_type} anonymously to the community price feed.
        </p>
        <Button size="sm" onClick={handleShare} className="mt-2.5 h-8 bg-accent text-accent-foreground hover:bg-accent/90">
          Share to Community
        </Button>
      </div>
      <button onClick={onDismiss} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground transition-colors">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}