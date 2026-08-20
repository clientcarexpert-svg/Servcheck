import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CheckCircle, AlertTriangle, XOctagon, Car } from "lucide-react";
import { motion } from "framer-motion";
import moment from "moment";
import { SkeletonGrid } from "@/components/SkeletonLoader";
import SavingsPromptBanner from "@/components/SavingsPromptBanner";

const VERDICT_ICONS = {
  fair: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  high: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  ripoff: { icon: XOctagon, color: "text-red-600", bg: "bg-red-50" },
};

export default function History() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.QuoteCheck.list("-created_date", 50);
      setChecks(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Your Account</p>
          <h1 className="font-heading text-3xl font-black text-[#1a237e] mb-1.5 leading-tight">Quote History</h1>
          <p className="text-slate-500 text-sm">Every analysis at a glance — verdicts, prices & savings</p>
        </motion.div>
        <SkeletonGrid count={5} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Your Account</p>
        <h1 className="font-heading text-3xl font-black text-[#1a237e] mb-1.5 leading-tight">Quote History</h1>
        <p className="text-slate-500 text-sm">Every analysis at a glance — verdicts, prices & savings</p>
      </motion.div>

      <div className="mb-6">
        <SavingsPromptBanner />
      </div>

      {checks.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Car className="h-8 w-8 text-slate-300" />
          </div>
          <p className="font-semibold text-slate-600 mb-1">No checks yet</p>
          <p className="text-sm text-slate-400">Analyse your first mechanic quote to see it here.</p>
          <Link
            to="/"
            className="text-sm font-medium text-accent-foreground hover:underline mt-2 inline-block"
          >
            Check your first quote →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {checks.map((check, i) => {
            const v = VERDICT_ICONS[check.verdict] || VERDICT_ICONS.fair;
            const Icon = v.icon;
            return (
              <motion.div
                key={check.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/results?id=${check.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-slate-200 transition-all group"
                >
                  <div
                    className={`h-10 w-10 rounded-2xl ${v.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}
                  >
                    <Icon className={`h-5 w-5 ${v.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {check.car_year} {check.car_make} {check.car_model} —{" "}
                      {check.service_type}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Quoted ${check.quoted_price?.toLocaleString()} ·{" "}
                      {check.state} ·{" "}
                      {moment(check.created_date).fromNow()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${v.bg} ${v.color}`}>
                      {check.verdict}
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}