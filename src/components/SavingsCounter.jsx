import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { TrendingDown } from "lucide-react";

export default function SavingsCounter() {
  const { data: total } = useQuery({
    queryKey: ["savings-total"],
    queryFn: async () => {
      const rows = await base44.entities.AppStats.filter({ key: "savings_total" });
      return rows[0]?.value_number || 0;
    },
    staleTime: 1000 * 60 * 30,
  });

  if (!total) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4"
    >
      <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
        <TrendingDown className="h-5 w-5 text-white" />
      </div>
      <p className="text-sm font-bold text-emerald-900">
        Overquotes caught by ServCheck users:{" "}
        <span className="text-lg font-black text-emerald-700">${Math.round(total).toLocaleString()}</span>
      </p>
    </motion.div>
  );
}