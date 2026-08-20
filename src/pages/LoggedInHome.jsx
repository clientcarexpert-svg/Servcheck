import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, History, Users, MapPin, Wrench, Car, ChevronRight, Shield, Gift, BarChart2, ArrowRight, Tag, Loader2, CheckCircle2, Stethoscope } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useReferralAutoClaim } from "@/hooks/useReferralAutoClaim";
import SavingsCounter from "../components/SavingsCounter";
import SavingsTotalDisplay from "../components/SavingsTotalDisplay";
import CarHealthScore from "../components/CarHealthScore";

const QUICK_ACTIONS = [
  { label: "Logbook", icon: BookOpen, to: "/logbook" },
  { label: "Directory", icon: MapPin, to: "/directory" },
  { label: "Community", icon: Users, to: "/community" },
  { label: "History", icon: History, to: "/history" },
];

const TOOLS = [
  {
    icon: Wrench,
    title: "Check a Quote",
    desc: "Find out instantly if your mechanic is charging fairly.",
    to: "/check-quote",
    accent: "bg-[#f97316]",
  },
  {
    icon: Car,
    title: "Car Buyer Check",
    desc: "Market-verified valuation before you commit to a purchase.",
    to: "/buy-car",
    accent: "bg-blue-600",
  },
  {
    icon: BookOpen,
    title: "Digital Logbook",
    desc: "Build a verified service record and track your car's equity.",
    to: "/logbook",
    accent: "bg-violet-600",
  },
  {
    icon: BarChart2,
    title: "Community Prices",
    desc: "Real prices paid by Australians — transparent and verified.",
    to: "/community",
    accent: "bg-emerald-600",
  },
  {
    icon: Stethoscope,
    title: "Symptom Checker",
    desc: "Describe your car's symptoms — get ranked causes, urgency & repair costs.",
    to: "/symptom-checker",
    accent: "bg-rose-600",
  },
];



export default function LoggedInHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.full_name?.split(" ")[0] || "there";
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [promoClaimed, setPromoClaimed] = useState(user?.referral_claimed || false);

  // Auto-claim if ?ref= is in the URL
  useReferralAutoClaim(user);

  const handleClaimPromo = async () => {
    if (!promoCode.trim()) return;
    setClaiming(true);
    try {
      const res = await base44.functions.invoke("claimReferral", { code: promoCode.trim() });
      if (res.data?.success) {
        setPromoClaimed(true);
        setPromoCode("");
        window.dispatchEvent(new Event("credits-updated"));
        toast.success("🎉 5 free credits added to your account!");
      } else {
        toast.error(res.data?.error || "Failed to apply code.");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.data?.error ||
        err?.message ||
        "Invalid or already used code.";
      toast.error(msg);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">

      {/* ── HERO — Full-bleed dark navy with honeycomb ── */}
      <motion.section
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
        className="relative overflow-hidden"
        style={{ background: "#0B1120" }}
      >
        {/* Honeycomb pattern overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="honeycomb-hero" x="0" y="0" width="56" height="50" patternUnits="userSpaceOnUse">
              <polygon points="14,2 42,2 56,25 42,48 14,48 0,25" fill="none" stroke="white" strokeWidth="1.5"/>
              <polygon points="42,27 70,27 84,50 70,73 42,73 28,50" fill="none" stroke="white" strokeWidth="1.5"/>
              <polygon points="-14,27 14,27 28,50 14,73 -14,73 -28,50" fill="none" stroke="white" strokeWidth="1.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#honeycomb-hero)"/>
        </svg>

        {/* Subtle gradient glow */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%)" }} />

        <div className="max-w-lg mx-auto px-5 pt-10 pb-12 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-xs font-bold text-white/80 uppercase tracking-wider mb-6 backdrop-blur-sm">
            <Shield className="h-3 w-3" /> On the Driver's Side
          </div>

          <h1 className="font-heading text-4xl font-black leading-[1.1] mb-3 text-white">
            G'day, <span className="text-[#f97316]">{firstName}!</span>
          </h1>
          <p className="text-lg leading-relaxed mb-6 text-slate-300">
            What do you need help with today?
          </p>

          <button
            onClick={() => navigate("/check-quote")}
            className="flex items-center justify-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-white font-heading font-bold text-base px-8 py-4 rounded-2xl shadow-lg shadow-orange-500/20 transition-all hover:shadow-xl hover:shadow-orange-500/30"
          >
            Check a Quote <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </motion.section>



      <div className="max-w-lg mx-auto px-5 py-8 space-y-8">

        <SavingsTotalDisplay />

        <CarHealthScore userId={user?.id} />

        <SavingsCounter />

        {/* ── QUICK ACCESS — horizontal pill row ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Quick Access</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {QUICK_ACTIONS.map(({ label, icon: Icon, to }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 bg-white rounded-full px-4 py-2.5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow whitespace-nowrap flex-shrink-0"
              >
                <Icon className="h-4 w-4 text-[#0B1120]" />
                <span className="text-sm font-semibold text-slate-700">{label}</span>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* ── TOOLS — list rows with chevron ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Tools</p>
          <div className="space-y-3">
            {TOOLS.map(({ icon: Icon, title, desc, to, accent }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-base text-[#0B1120]">{title}</p>
                  <p className="text-sm text-slate-500 font-medium leading-snug">{desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </motion.section>



        {/* ── PROMO CODE ── */}
        {!promoClaimed && (
          <motion.section
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          >
            <button
              onClick={() => setShowPromo(v => !v)}
              className="w-full flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3.5 shadow-sm hover:border-slate-300 transition-colors"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Tag className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-base font-bold text-[#0B1120]">Have a promo code?</p>
                <p className="text-sm text-slate-500">Claim 5 free credits instantly</p>
              </div>
              <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${showPromo ? "rotate-90" : ""}`} />
            </button>

            <AnimatePresence>
              {showPromo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white border border-t-0 border-slate-200 rounded-b-2xl px-4 pb-4 pt-3 space-y-3">
                    <div className="flex gap-2">
                      <input
                        placeholder="Enter code e.g. SCJOHN4B"
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === "Enter" && handleClaimPromo()}
                        className="flex-1 h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-mono font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        onClick={handleClaimPromo}
                        disabled={!promoCode.trim() || claiming}
                        className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 flex-shrink-0 transition-colors"
                      >
                        {claiming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Claim"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* ── REFER & EARN ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        >
          <div
            className="rounded-2xl p-5 flex items-center gap-4 cursor-pointer relative overflow-hidden"
            style={{ background: "#0B1120" }}
            onClick={() => window.dispatchEvent(new CustomEvent("open-referral"))}
          >
            {/* Honeycomb pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="honeycomb-refer" x="0" y="0" width="56" height="50" patternUnits="userSpaceOnUse">
                  <polygon points="14,2 42,2 56,25 42,48 14,48 0,25" fill="none" stroke="white" strokeWidth="1.5"/>
                  <polygon points="42,27 70,27 84,50 70,73 42,73 28,50" fill="none" stroke="white" strokeWidth="1.5"/>
                  <polygon points="-14,27 14,27 28,50 14,73 -14,73 -28,50" fill="none" stroke="white" strokeWidth="1.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#honeycomb-refer)"/>
            </svg>
            <div className="flex-1 min-w-0 relative z-10">
              <p className="font-heading font-bold text-base text-white">Refer a friend, earn credits</p>
              <p className="text-sm text-slate-400 font-medium mt-0.5">Free credits for every signup you bring in.</p>
            </div>
            <button className="flex-shrink-0 text-xs font-bold text-white bg-[#f97316] hover:bg-[#ea6c0a] px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap relative z-10">
              Share
            </button>
          </div>
        </motion.section>

      </div>
    </div>
  );
}