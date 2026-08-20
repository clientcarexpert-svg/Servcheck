import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Wrench, Zap, Star, Users, ChevronRight, Bell, DollarSign, TrendingUp, ArrowRight } from "lucide-react";

export default function MechanicHome() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          const profiles = await base44.entities.MechanicProfile.filter({ user_email: user.email });
          if (profiles.length > 0) setProfile(profiles[0]);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1a237e] to-[#0d47a1] px-4 pt-12 pb-10 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Wrench className="h-8 w-8 text-white" />
          </div>
          {profile ? (
            <>
              <h1 className="font-heading text-3xl font-extrabold text-white mb-2">
                Welcome back, {profile.business_name}
              </h1>
              <p className="text-blue-200 text-sm font-medium mb-6">
                {profile.suburb}, {profile.state} · {profile.mechanic_type?.replace("_", " ")}
              </p>
            </>
          ) : (
            <>
              <h1 className="font-heading text-3xl font-extrabold text-white mb-2">Welcome, Mechanic</h1>
              <p className="text-blue-200 text-sm font-medium mb-6">Manage your business from here</p>
            </>
          )}
          <button
            onClick={() => navigate("/mechanic-portal")}
            className="inline-flex items-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-white font-heading font-bold text-base px-8 py-4 rounded-2xl shadow-lg shadow-orange-900/30 transition-colors"
          >
            Go to My Portal <ArrowRight className="h-5 w-5" />
          </button>
        </motion.div>
      </section>

      {/* Quick Actions */}
      <section className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-5">Quick Actions</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Zap, label: "Live Leads", desc: "View new service requests", color: "bg-amber-50 border-amber-200", iconColor: "text-amber-600 bg-amber-100", path: "/mechanic-portal" },
            { icon: Bell, label: "Notifications", desc: "Check your alerts", color: "bg-blue-50 border-blue-200", iconColor: "text-blue-600 bg-blue-100", path: "/mechanic-portal" },
            { icon: Users, label: "Diagnostic Requests", desc: "Mobile diagnosis jobs", color: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-600 bg-emerald-100", path: "/mechanic-portal" },
            { icon: Star, label: "My Profile", desc: "Update business info", color: "bg-purple-50 border-purple-200", iconColor: "text-purple-600 bg-purple-100", path: "/mechanic-portal" },
          ].map((item, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              onClick={() => navigate(item.path)}
              className={`rounded-2xl border-2 p-4 text-left hover:shadow-md transition-all group ${item.color}`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${item.iconColor}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <p className="font-heading font-bold text-sm text-slate-900">{item.label}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* How It Works for Mechanics */}
      <section className="bg-slate-50 border-t border-slate-100 py-10">
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-6">How ServCheck Works for Mechanics</p>
          <div className="space-y-4">
            {[
              { icon: Zap, title: "Get matched to local leads", desc: "Customers nearby submit quote requests — you get notified instantly.", color: "bg-amber-500" },
              { icon: DollarSign, title: "Claim leads with credits", desc: "Use your credits to unlock customer contact details. Free leads every month.", color: "bg-emerald-500" },
              { icon: TrendingUp, title: "Grow your business", desc: "Upgrade to Featured to appear at the top of search results.", color: "bg-blue-500" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-4 bg-white rounded-2xl border border-slate-200 p-4"
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-heading font-bold text-sm text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <button
            onClick={() => navigate("/mechanic-portal")}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-[#1a237e] bg-[#1a237e] text-white font-heading font-bold text-sm py-4 hover:bg-[#1e2d8f] transition-colors"
          >
            Open Full Portal <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}