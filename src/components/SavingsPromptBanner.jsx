import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { PiggyBank, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const dismissedKey = (id) => `savings_prompt_dismissed_${id}`;

export default function SavingsPromptBanner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [hidden, setHidden] = useState(false);

  const { data: pendingQuote } = useQuery({
    queryKey: ["savings-prompt", user?.email],
    enabled: !!user,
    queryFn: async () => {
      const [quotes, reports] = await Promise.all([
        base44.entities.QuoteCheck.filter({ savings_followup_sent: true }, "-created_date", 20),
        base44.entities.SavingsReport.list("-created_date", 50),
      ]);
      const reportedIds = new Set(reports.map((r) => r.quote_check_id));
      return (
        quotes.find(
          (q) => !reportedIds.has(q.id) && !localStorage.getItem(dismissedKey(q.id))
        ) || null
      );
    },
  });

  if (!pendingQuote || hidden) return null;

  const dismiss = () => {
    localStorage.setItem(dismissedKey(pendingQuote.id), "1");
    setHidden(true);
  };

  const submit = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value < 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      await base44.entities.SavingsReport.create({
        quote_check_id: pendingQuote.id,
        amount_saved: value,
        comment: comment.trim() || undefined,
        user_email: user.email,
      });
      toast.success("Thanks for sharing — every report helps other drivers!");
      setHidden(true);
      queryClient.invalidateQueries({ queryKey: ["savings-prompt"] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="bg-white border-2 border-[#f97316]/30 rounded-2xl p-5 shadow-sm relative"
      >
        <button onClick={dismiss} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <PiggyBank className="h-5 w-5 text-[#f97316]" />
          </div>
          <div>
            <p className="font-heading font-bold text-base text-[#0B1120]">
              Did you end up negotiating or finding a better price?
            </p>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Tell us how much you saved on your {pendingQuote.car_make} {pendingQuote.car_model}{" "}
              {pendingQuote.service_type} quote.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
              <input
                type="number"
                min="0"
                placeholder="Amount saved"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 pl-7 pr-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
            <button
              onClick={submit}
              disabled={!amount || saving}
              className="h-10 px-5 bg-[#f97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center gap-1.5 flex-shrink-0 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
            </button>
          </div>
          <input
            placeholder="Optional comment (e.g. found a cheaper mobile mechanic)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}