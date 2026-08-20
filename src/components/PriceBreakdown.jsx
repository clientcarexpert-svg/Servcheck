import { motion } from "framer-motion";
import { Wrench } from "lucide-react";

export default function PriceBreakdown({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
          <Wrench className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-lg">
            What should be included
          </h3>
          <p className="text-sm text-muted-foreground">
            Make sure your mechanic covers all of these
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-white">
                {i + 1}
              </span>
            </div>
            <div>
              <p className="font-medium text-sm">{item.item}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200">
        <p className="text-sm text-amber-800 font-medium">
          💡 If any of these aren't included, ask your mechanic why — they might
          be cutting corners.
        </p>
      </div>
    </motion.div>
  );
}