import { motion } from "framer-motion";
import { MessageCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function MechanicQuestions({ questions }) {
  if (!questions || questions.length === 0) return null;

  const copyAll = () => {
    navigator.clipboard.writeText(questions.map((q, i) => `${i + 1}. ${q}`).join("\n"));
    toast.success("Questions copied!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.4 }}
      className="rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg">Talk to your mechanic</h3>
            <p className="text-sm text-muted-foreground">Ask these questions before agreeing</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={copyAll} className="gap-1.5 text-xs">
          <Copy className="h-3 w-3" />
          Copy all
        </Button>
      </div>

      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={i} className="flex gap-3 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
            <span className="font-heading font-bold text-blue-600 text-sm flex-shrink-0 mt-0.5">
              Q{i + 1}
            </span>
            <p className="text-sm text-foreground leading-relaxed">{q}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}