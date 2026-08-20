import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import SEOHead from "../components/SEOHead";
import { CheckCircle2, ArrowRight } from "lucide-react";

const FAQS = (brand) => [
  {
    q: "Is ServCheck free to try?",
    a: "Yes — your first 3 quote checks are completely free. No credit card required.",
  },
  {
    q: `Do I need to have used ${brand}?`,
    a: `No. ServCheck works with any quote from any mechanic — whether it came from ${brand}, your local workshop, a dealer, or anywhere else.`,
  },
  {
    q: "How accurate is ServCheck?",
    a: "Our verdicts are based on real Australian pricing data — sourced from actual quotes, workshops, and parts retailers — and updated continuously to reflect current market rates.",
  },
];

function StatCard({ value, label, loading }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
      <p className="text-3xl sm:text-4xl font-heading font-black text-[#1a237e] leading-none">
        {loading ? <span className="inline-block w-16 h-8 bg-slate-100 rounded animate-pulse" /> : value}
      </p>
      <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-2">{label}</p>
    </div>
  );
}

function ComparisonCard({ index, brand, servcheck }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-7 w-7 rounded-full bg-[#1a237e] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {index}
        </div>
        <div className="space-y-3 flex-1">
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{brand}</p>
          <div className="flex items-start gap-2 pt-3 border-t border-slate-100">
            <CheckCircle2 className="h-5 w-5 text-[#f97316] flex-shrink-0 mt-0.5" />
            <p className="text-[#1a237e] font-bold text-sm sm:text-base leading-relaxed">{servcheck}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VsCompetitor({ competitor, slug }) {
  const [stats, setStats] = useState({ quotes: null, avgSaving: null, ripoffRate: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const checks = await base44.entities.QuoteCheck.list("-created_date", 1000);
        const total = checks.length;
        const ripoffs = checks.filter(c => {
          const v = (c.verdict || "").toLowerCase();
          return v.includes("ripoff") || v.includes("rip-off") || v.includes("overpriced") || v.includes("high");
        });
        const savings = checks
          .map(c => {
            const quoted = Number(c.total_quoted) || 0;
            const fair = Number(c.suggested_total) || 0;
            return quoted > fair ? quoted - fair : 0;
          })
          .filter(s => s > 0);
        const avgSaving = savings.length
          ? Math.round(savings.reduce((a, b) => a + b, 0) / savings.length)
          : 0;
        const ripoffRate = total > 0 ? Math.round((ripoffs.length / total) * 100) : 0;

        setStats({
          quotes: total.toLocaleString("en-AU"),
          avgSaving: `$${avgSaving.toLocaleString("en-AU")}`,
          ripoffRate: `${ripoffRate}%`,
        });
      } catch {
        setStats({ quotes: "—", avgSaving: "—", ripoffRate: "—" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const faqs = FAQS(competitor);

  return (
    <div className="min-h-screen bg-slate-50">
      <SEOHead
        title={`ServCheck vs ${competitor} — Find out if your quote is fair`}
        description={`Already have a ${competitor} quote? ServCheck tells you if it's actually fair before you pay. Based on real Australian pricing data.`}
        path={`/vs/${slug || competitor.toLowerCase().replace(/[^a-z0-9]+/g, "")}`}
      />

      {/* Minimal logo bar (no nav) */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link to="/" className="flex items-center gap-2 w-fit">
            <img
              src="https://media.base44.com/images/public/69c3e608178c08315713aa79/d1f539b4e_generated_image.png"
              alt="ServCheck"
              className="h-8 w-8 object-contain"
            />
            <span className="font-heading font-bold text-xl tracking-tight text-[#1a237e]">
              Serv<span className="text-[#f97316]">Check</span>
            </span>
          </Link>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        {/* Headline */}
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-wider text-[#f97316] mb-3">
            ServCheck vs {competitor}
          </p>
          <h1 className="text-3xl sm:text-5xl font-heading font-black text-[#1a237e] leading-tight">
            Already have a {competitor} quote?
          </h1>
          <p className="text-2xl sm:text-3xl font-heading font-black text-slate-700 mt-2">
            Find out if it's <span className="text-[#f97316]">actually fair.</span>
          </p>
        </div>

        {/* Comparison cards */}
        <div className="space-y-4 mb-10">
          <ComparisonCard
            index={1}
            brand={`${competitor} connects you with mechanics.`}
            servcheck="ServCheck tells you if their quote is fair before you pay."
          />
          <ComparisonCard
            index={2}
            brand={`${competitor} shows you prices from their network.`}
            servcheck="ServCheck shows you real Australian market prices for your specific car."
          />
          <ComparisonCard
            index={3}
            brand={`${competitor} makes money when you book.`}
            servcheck="ServCheck makes money when you save."
          />
        </div>

        {/* CTA */}
        <div className="text-center mb-12">
          <Link
            to="/check-quote"
            className="inline-flex items-center justify-center gap-2 bg-[#1a237e] hover:bg-[#0f1659] text-white font-heading font-bold text-base sm:text-lg px-8 py-4 rounded-2xl shadow-lg transition-colors w-full sm:w-auto"
          >
            Check My Quote Now <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="text-xs text-slate-500 mt-3">First 3 checks free · No credit card required</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-12">
          <StatCard value={stats.quotes} label="Quotes Analysed" loading={loading} />
          <StatCard value={stats.avgSaving} label="Average Saving Found" loading={loading} />
          <StatCard value={stats.ripoffRate} label="Ripoff Rate in Australia" loading={loading} />
        </div>

        {/* FAQ */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7">
          <h2 className="text-xl sm:text-2xl font-heading font-black text-[#1a237e] mb-5">
            Frequently asked
          </h2>
          <div className="space-y-5">
            {faqs.map((f, i) => (
              <div key={i} className="pb-5 border-b border-slate-100 last:border-b-0 last:pb-0">
                <p className="font-bold text-[#1a237e] text-sm sm:text-base mb-1.5">{f.q}</p>
                <p className="text-slate-600 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-10">
          ServCheck is independent and not affiliated with {competitor}.
        </p>
      </main>
    </div>
  );
}