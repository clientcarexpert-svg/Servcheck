import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";

export default function ACLWarning({ warning, text }) {
  if (!warning) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border-2 border-red-300 bg-red-50 p-6"
    >
      <div className="flex gap-3">
        <ShieldAlert className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-heading font-bold text-red-800 mb-1">⚠️ Your Consumer Rights at Risk</h3>
          <p className="text-sm text-red-700 leading-relaxed mb-3">{text}</p>
          <p className="text-xs font-medium text-red-800 bg-red-100 rounded-lg p-3 border border-red-200">
            Under the <strong>Australian Consumer Law (ACL)</strong>, you are entitled to a statutory warranty on all automotive repairs. Mechanics cannot legally waive this — regardless of any "no refund" or "cash only" clauses on a quote.
          </p>
        </div>
      </div>
    </motion.div>
  );
}