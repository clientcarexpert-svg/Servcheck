import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Users, TrendingDown } from "lucide-react";

export default function CommunityInsight({ serviceType, carMake, carModel, state, suburb }) {
  const [insight, setInsight] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!serviceType || !state) return;
      const posts = await base44.entities.CommunityPost.filter({ service_type: serviceType, state }, "-created_date", 50);
      if (posts.length < 2) return;

      // Look for posts with a lower price paid
      const cheaper = posts.filter(p => p.price_paid && p.mechanic_name && p.suburb);
      if (cheaper.length === 0) return;

      // Group by mechanic name to find repeated ones
      const map = {};
      for (const p of cheaper) {
        const key = p.mechanic_name.toLowerCase();
        if (!map[key]) map[key] = { name: p.mechanic_name, suburb: p.suburb, prices: [] };
        if (p.price_paid) map[key].prices.push(p.price_paid);
      }

      // Find a mechanic with 1+ reports and a cheap average
      const candidates = Object.values(map)
        .filter(m => m.prices.length >= 1)
        .map(m => ({ ...m, avg: Math.round(m.prices.reduce((a, b) => a + b, 0) / m.prices.length) }))
        .sort((a, b) => a.avg - b.avg);

      if (candidates.length > 0) {
        setInsight({ ...candidates[0], reportCount: posts.length });
      }
    };
    load();
  }, [serviceType, state]);

  if (!insight) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <TrendingDown className="h-4 w-4 text-emerald-600" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-heading font-bold text-emerald-800 text-sm">Community Tip</h3>
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <Users className="h-3 w-3" /> {insight.reportCount} driver{insight.reportCount !== 1 ? "s" : ""} shared prices for this service in {state}
            </span>
          </div>
          <p className="text-sm text-emerald-700 leading-relaxed">
            Other users reported a cheaper price for <strong>{serviceType}</strong> at{" "}
            <strong>{insight.name}</strong> in {insight.suburb}, {state} — average around{" "}
            <strong>${insight.avg}</strong>. Worth getting a quote!
          </p>
        </div>
      </div>
    </motion.div>
  );
}