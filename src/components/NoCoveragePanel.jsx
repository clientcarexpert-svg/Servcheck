import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Wrench, Bell, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";

export default function NoCoveragePanel({ suburb, state }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  // Check if user already joined the waitlist for this suburb
  useEffect(() => {
    if (!user || !suburb) return;
    base44.entities.SuburbWaitlist.filter({ suburb, state }).then((rows) => {
      if (rows.length > 0) setJoined(true);
    });
  }, [user, suburb, state]);

  const joinWaitlist = async () => {
    setJoining(true);
    try {
      await base44.entities.SuburbWaitlist.create({
        suburb: suburb || "Unknown",
        state,
        user_email: user.email,
      });
      setJoined(true);
      toast.success("You're on the waitlist — we'll let you know!");
    } finally {
      setJoining(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-200/50 flex items-center justify-center flex-shrink-0">
          <Wrench className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <p className="font-heading font-bold text-sm text-slate-900">
            No local mechanics here yet — join the waitlist and we'll notify you
          </p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            We're growing our network in {suburb ? `${suburb}, ` : ""}{state}. In the meantime, use this report as leverage — show it to your mechanic and negotiate using the fair price range and counter-offer above.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        {user && (
          joined ? (
            <div className="w-full flex items-center justify-center gap-2 h-9 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4" /> You're on the waitlist
            </div>
          ) : (
            <Button
              onClick={joinWaitlist}
              disabled={joining}
              className="w-full gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-white font-bold"
            >
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              Join the Waitlist
            </Button>
          )
        )}
        <Button
          onClick={() => navigate("/logbook")}
          variant="outline"
          className="w-full gap-2 border-slate-300 text-slate-700"
        >
          <BookOpen className="h-4 w-4" /> Save to Digital Logbook
        </Button>
        <Button
          onClick={() => navigate("/faq")}
          variant="ghost"
          className="w-full text-xs text-slate-500 hover:text-slate-800"
        >
          How to negotiate with a mechanic →
        </Button>
      </div>
    </motion.div>
  );
}