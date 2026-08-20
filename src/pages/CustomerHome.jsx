import { motion } from "framer-motion";
import { Camera, Search, ChevronRight, MapPin, BookOpen, History, Users, Shield, Wrench, Car, BarChart2, Stethoscope } from "lucide-react";
import BullshitMeter from "../components/BullshitMeter";
import SEOHead, { WEBSITE_SCHEMA, SOFTWARE_APP_SCHEMA, QUOTE_FAQ_SCHEMA } from "../components/SEOHead";
import SEOFooter from "../components/SEOFooter";
import SavingsCounter from "../components/SavingsCounter";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

const HOME_SCHEMA = [WEBSITE_SCHEMA, SOFTWARE_APP_SCHEMA, QUOTE_FAQ_SCHEMA];

const QUICK_ACTIONS = [
  { label: "Logbook", icon: BookOpen, to: "/logbook", border: "border-[#f97316]" },
  { label: "Directory", icon: MapPin, to: "/directory", border: "border-blue-600" },
  { label: "Community", icon: Users, to: "/community", border: "border-emerald-600" },
  { label: "History", icon: History, to: "/history", border: "border-violet-600" },
];



const TOOLS = [
  { icon: Wrench, title: "Check a Quote", desc: "Find out instantly if your mechanic is charging fairly.", to: "/check-quote", accent: "bg-[#f97316]", border: "border-[#f97316]" },
  { icon: Stethoscope, title: "Symptom Checker", desc: "Describe symptoms — get ranked causes, urgency & repair costs.", to: "/symptom-checker", accent: "bg-rose-600", border: "border-rose-600" },
  { icon: Car, title: "Car Buyer Check", desc: "Market-verified valuation before you commit to a purchase.", to: "/buy-car", accent: "bg-blue-600", border: "border-blue-600" },
  { icon: BarChart2, title: "Community Prices", desc: "Real prices paid by Australians — transparent and verified.", to: "/community", accent: "bg-emerald-600", border: "border-emerald-600" },
];

export default function CustomerHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = !user;

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <SEOHead
        title="ServCheck — Is Your Mechanic Quote Fair? | Australia's Car Service Checker"
        description="Check if your mechanic is overcharging you. ServCheck analyses quotes, tracks your car's service history, and connects you with trusted Australian mechanics."
        path="/"
        schema={HOME_SCHEMA}
      />

      {/* ── HERO — Full-bleed dark navy ── */}
      <motion.section
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
        className="relative overflow-hidden"
        style={{ background: "#0B1120" }}
      >
        {/* Honeycomb pattern overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="honeycomb-hero-guest" x="0" y="0" width="56" height="50" patternUnits="userSpaceOnUse">
              <polygon points="14,2 42,2 56,25 42,48 14,48 0,25" fill="none" stroke="white" strokeWidth="1.5"/>
              <polygon points="42,27 70,27 84,50 70,73 42,73 28,50" fill="none" stroke="white" strokeWidth="1.5"/>
              <polygon points="-14,27 14,27 28,50 14,73 -14,73 -28,50" fill="none" stroke="white" strokeWidth="1.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#honeycomb-hero-guest)"/>
        </svg>

        {/* Subtle gradient glow */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%)" }} />

        <div className="max-w-lg mx-auto px-5 pt-10 pb-12 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-xs font-bold text-white/80 uppercase tracking-wider mb-6 backdrop-blur-sm">
            <Shield className="h-3 w-3" /> On the Driver's Side
          </div>

          <h1 className="font-heading text-4xl font-black leading-[1.1] mb-3 text-white">
            Is your mechanic<br />quote <span className="text-[#f97316]">fair?</span>
          </h1>
          <p className="text-lg leading-relaxed mb-2 text-slate-300 max-w-sm">
            ServCheck checks your quote against real Australian market data — verdict in seconds.
          </p>
          <p className="text-sm font-bold text-[#f97316] mb-6">✓ First check on us — free</p>

          <button
            onClick={() => navigate("/check-quote")}
            className="flex items-center justify-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-white font-heading font-bold text-base px-8 py-4 rounded-2xl shadow-lg shadow-orange-500/20 transition-all hover:shadow-xl hover:shadow-orange-500/30"
          >
            Check your quote now <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </motion.section>



      <div className="max-w-lg mx-auto px-5 py-8 space-y-8">

        <SavingsCounter />

        {/* ── QUICK ACCESS — logged in only ── */}
        {!isGuest && (
          <motion.section
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Quick Access</p>
            <div className="grid grid-cols-4 gap-3">
              {QUICK_ACTIONS.map(({ label, icon: Icon, to, border }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex flex-col items-center gap-2 bg-white rounded-2xl p-4 border-t-[3px] ${border} shadow-sm hover:shadow-md transition-shadow`}
                >
                  <Icon className="h-6 w-6 text-[#0B1120]" />
                  <span className="text-xs font-semibold text-slate-700 text-center leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── TOOLS ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Tools</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TOOLS.map(({ icon: Icon, title, desc, to, accent, border }) => (
              <Link
                key={to}
                to={to}
                className={`bg-white rounded-2xl p-5 border-t-[3px] ${border} shadow-sm hover:shadow-md transition-all group`}
              >
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 ${accent}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <p className="font-heading font-bold text-base text-[#0B1120] mb-1">{title}</p>
                <p className="text-sm text-slate-500 font-medium leading-snug">{desc}</p>
                {to === "/check-quote" && (
                  <button className="mt-4 flex items-center gap-1.5 bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors">
                    Check a Quote <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </Link>
            ))}
          </div>
        </motion.section>

        {/* ── HOW IT WORKS ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <h2 className="font-heading font-black text-xl text-[#0B1120] mb-5">How It Works</h2>
          <div className="relative pl-8">
            <div className="absolute left-[11px] top-3 bottom-3 w-px border-l-2 border-dashed border-slate-200" />
            {[
              { n: "1", title: "Enter Your Quote", sub: "Type or scan your mechanic's invoice" },
              { n: "2", title: "We Check the Market", sub: "Compared against real Australian pricing data" },
              { n: "3", title: "Get Your Verdict", sub: "Fair, High, or Overpriced — instantly" },
            ].map((step, i) => (
              <div key={i} className="relative flex items-start gap-4 mb-5 last:mb-0">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-[#0B1120] flex items-center justify-center text-white text-xs font-extrabold z-10">
                  {step.n}
                </div>
                <div>
                  <p className="font-heading font-bold text-sm text-[#0B1120]">{step.title}</p>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">{step.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── BS METER PREVIEW ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        >
          <h2 className="font-heading font-black text-xl text-[#0B1120] mb-1">Everything You Need</h2>
          <p className="text-sm text-slate-500 font-medium mb-5">Tools built for Australian car owners</p>
          <div className="mb-3">
            <BullshitMeter score={8} reasoning="This example quote shows signs of parts markup above typical Australian rates — a common red flag." />
          </div>
          <div className="space-y-3">
            {[
              { icon: Camera, title: "Scan Receipt", desc: "Upload your invoice for instant OCR analysis" },
              { icon: Search, title: "Quote Analyser", desc: "Get a fair price range for any repair" },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="flex items-center gap-4 bg-white rounded-2xl px-5 py-5 shadow-sm">
                <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-6 w-6 text-[#f97316]" />
                </div>
                <div>
                  <p className="font-heading font-bold text-base text-[#0B1120]">{title}</p>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── WHY SERVCHECK — dark navy card matching hero ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="relative overflow-hidden rounded-3xl shadow-xl"
          style={{ background: "#0B1120" }}
        >
          {/* Honeycomb pattern — same as hero */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="honeycomb-why" x="0" y="0" width="56" height="50" patternUnits="userSpaceOnUse">
                <polygon points="14,2 42,2 56,25 42,48 14,48 0,25" fill="none" stroke="white" strokeWidth="1.5"/>
                <polygon points="42,27 70,27 84,50 70,73 42,73 28,50" fill="none" stroke="white" strokeWidth="1.5"/>
                <polygon points="-14,27 14,27 28,50 14,73 -14,73 -28,50" fill="none" stroke="white" strokeWidth="1.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#honeycomb-why)"/>
          </svg>
          {/* Orange glow */}
          <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.5) 0%, transparent 70%)" }} />

          <div className="relative z-10 p-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold text-white/70 uppercase tracking-widest mb-4 backdrop-blur-sm">
              <Shield className="h-3 w-3" /> Why ServCheck
            </div>
            <h2 className="font-heading font-black text-2xl text-white leading-tight mb-1">
              Everything an Aussie<br />car owner <span className="text-[#f97316]">needs.</span>
            </h2>
            <p className="text-sm text-slate-400 font-medium mb-6">One app, on the driver's side.</p>

            <div className="space-y-2.5">
              {[
                { icon: Wrench, title: "Quote Checker", desc: "Instantly know if your quote is a fair price" },
                { icon: Car, title: "Car Buyer Check", desc: "Market-verified valuation before you buy any used car" },
                { icon: BookOpen, title: "Digital Logbook", desc: "Track every service, scan receipts, build equity" },
                { icon: MapPin, title: "Mechanic Directory", desc: "Find trusted workshops near you" },
                { icon: Users, title: "Community Forum", desc: "Real prices shared by real Australians" },
              ].map(({ icon: Icon, title, desc }, i) => (
                <div key={i} className="flex items-center gap-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] px-4 py-3.5 backdrop-blur-sm">
                  <div className="h-10 w-10 rounded-xl bg-[#f97316] flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-heading font-bold text-white">{title}</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5 leading-snug">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

      </div>



      <SEOFooter />
    </div>
  );
}