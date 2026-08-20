import { motion } from "framer-motion";
import { MessageSquare, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CounterOffer({ amount, reasoning, originalPrice, priceAverage }) {
  if (!amount && !priceAverage) return null;

  const counterAmount = priceAverage ? Math.round(priceAverage * 0.88) : amount;
  const savings = originalPrice - counterAmount;
  const script = `"I've done some research and the typical price for this job is around $${counterAmount.toLocaleString()}. I'd be happy to go ahead at that price."`;

  const copyScript = () => {
    navigator.clipboard.writeText(script);
    toast.success("Copied to clipboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="rounded-2xl border-2 border-accent bg-accent/5 p-6 sm:p-8"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-accent-foreground" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-lg">Your counter number</h3>
          <p className="text-sm text-muted-foreground">
            Say this with confidence
          </p>
        </div>
      </div>

      <div className="text-center py-6">
        <p className="font-heading text-5xl sm:text-6xl font-bold text-emerald-600">
          ${counterAmount.toLocaleString()}
        </p>
        {savings > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            That's{" "}
            <span className="font-semibold text-emerald-600">
              ${savings.toLocaleString()} less
            </span>{" "}
            than what you were quoted
          </p>
        )}
      </div>

      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            What to say
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyScript}
            className="h-7 text-xs gap-1"
          >
            <Copy className="h-3 w-3" />
            Copy
          </Button>
        </div>
        <p className="text-sm italic text-foreground leading-relaxed">
          {script}
        </p>
      </div>

      {reasoning && (
        <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
          {reasoning}
        </p>
      )}
    </motion.div>
  );
}