import { useAuth } from "@/lib/AuthContext";
import { TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

export default function SavingsTotalDisplay() {
  const { user } = useAuth();
  const savingsTotal = user?.savings_total || 0;

  if (savingsTotal === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 border border-emerald-200 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <TrendingDown className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-emerald-900">
            You've saved <span className="text-lg font-bold">${savingsTotal.toLocaleString()}</span>
          </p>
          <p className="text-xs text-emerald-700 mt-0.5">
            catching overquotes with ServCheck
          </p>
        </div>
      </div>
    </motion.div>
  );
}