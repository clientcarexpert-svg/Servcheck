import { motion } from "framer-motion";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function ServiceNecessity({ necessary, reasoning }) {
  if (reasoning === undefined || reasoning === null) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className={`rounded-2xl border-2 p-5 flex gap-3 ${
        necessary
          ? "bg-emerald-50 border-emerald-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      {necessary ? (
        <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
      )}
      <div>
        <p className={`font-heading font-bold text-sm mb-1 ${necessary ? "text-emerald-800" : "text-amber-800"}`}>
          {necessary ? "Service appears necessary" : "Is this service actually needed?"}
        </p>
        <p className={`text-sm leading-relaxed ${necessary ? "text-emerald-700" : "text-amber-700"}`}>
          {reasoning}
        </p>
      </div>
    </motion.div>
  );
}