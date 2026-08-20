import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEOHead from "../components/SEOHead";
import { Smartphone, MapPin, ChevronRight, Wrench, Star, Clock, Shield, CheckCircle2 } from "lucide-react";

const MOBILE_PERKS = [
  { icon: Clock, text: "They come to you — no towing, no waiting rooms" },
  { icon: Shield, text: "Get a written diagnosis report you can take anywhere" },
  { icon: CheckCircle2, text: "No pressure to commit to repairs on the spot" },
];

const WORKSHOP_PERKS = [
  { icon: MapPin, text: "Find trusted local workshops listed on ServCheck" },
  { icon: Star, text: "Community-verified ratings based on real prices paid" },
  { icon: Shield, text: "Compare prices before you book" },
];

export default function Mechanics() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      <SEOHead
        title="Verified Australian Mechanics — Compare & Find Trusted Workshops | ServCheck"
        description="Search verified mechanics by suburb or city. Read real reviews and compare service pricing from Australian car owners."
        path="/mechanics"
      />

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-4 pt-12 pb-8 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-500 uppercase tracking-wide mb-6">
            <Wrench className="h-3.5 w-3.5 text-slate-400" /> Find a Mechanic
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.1] text-[#1a237e] mb-4">
            Not sure what's wrong?{" "}
            <span className="text-[#f97316]">Get checked first.</span>
          </h1>
          <p className="text-base text-slate-500 leading-relaxed max-w-sm mx-auto">
            Never drive blind to a workshop. Choose a mobile mechanic or find a local workshop — before you commit to anything.
          </p>
        </motion.div>
      </section>

      {/* Two big options */}
      <section className="max-w-2xl mx-auto px-4 pb-12 space-y-5">

        {/* Mobile Mechanic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-3xl border-2 border-[#1a237e] bg-gradient-to-br from-[#1a237e] to-[#1565c0] p-6 sm:p-8 shadow-xl shadow-blue-200"
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Smartphone className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-0.5">Recommended</p>
              <h2 className="font-heading font-bold text-2xl text-white leading-tight">Mobile Mechanic</h2>
            </div>
          </div>

          <p className="text-blue-100 text-sm leading-relaxed mb-6">
            A licensed mechanic comes to your home or workplace, diagnoses the issue, and gives you a written report — so you know exactly what's wrong before you walk into any workshop.
          </p>

          <ul className="space-y-3 mb-7">
            {MOBILE_PERKS.map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm text-blue-100 font-medium">{text}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => navigate("/mobile-diagnostic-request")}
            className="group w-full flex items-center justify-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-white font-heading font-bold text-base px-6 py-4 rounded-2xl shadow-lg shadow-orange-900/30 transition-colors"
          >
            Get Mobile Mechanic Quotes
            <ChevronRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>

        {/* Local Workshop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-3xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 to-white p-6 sm:p-8 shadow-lg shadow-emerald-100"
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-0.5">Local</p>
              <h2 className="font-heading font-bold text-2xl text-[#1a237e] leading-tight">Workshop Near You</h2>
            </div>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Browse workshops listed on ServCheck in your area. Check their services and compare before you commit.
          </p>

          <ul className="space-y-3 mb-7">
            {WORKSHOP_PERKS.map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <span className="text-sm text-slate-600 font-medium">{text}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => navigate("/directory")}
            className="group w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-base px-6 py-4 rounded-2xl shadow-md transition-colors"
          >
            Browse Workshops Near Me
            <ChevronRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>

        {/* Already know what you need? */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex items-center justify-between gap-4"
        >
          <div>
            <p className="font-heading font-bold text-sm text-slate-800">Already know what service you need?</p>
            <p className="text-xs text-slate-500 mt-0.5">Check if your mechanic's quote is fair before you pay.</p>
          </div>
          <button
            onClick={() => navigate("/check-quote")}
            className="flex-shrink-0 flex items-center gap-1.5 bg-[#f97316] hover:bg-[#ea6c0a] text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            Check Quote <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      </section>
    </div>
  );
}