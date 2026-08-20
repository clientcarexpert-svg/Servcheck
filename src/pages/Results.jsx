import { useState, useEffect } from "react";
import SEOHead from "../components/SEOHead";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import VerdictCard from "../components/VerdictCard";
import PriceBreakdown from "../components/PriceBreakdown";
import CounterOffer from "../components/CounterOffer";
import BullshitMeter from "../components/BullshitMeter";
import MechanicQuestions from "../components/MechanicQuestions";
import ACLWarning from "../components/ACLWarning";
import ServiceNecessity from "../components/ServiceNecessity";
import CommunityInsight from "../components/CommunityInsight";
import { ArrowLeft, Car, Share2, MapPin, ShieldAlert, Globe, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import EstimateLoader from "../components/EstimateLoader";
import NoCoveragePanel from "../components/NoCoveragePanel";
import WhatCanISkip from "../components/WhatCanISkip";
import SubtleDisclaimer from "../components/SubtleDisclaimer";
import HomescreenBonusPrompt from "../components/HomescreenBonusPrompt";

export default function Results() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [routingNote, setRoutingNote] = useState("");
  const [hasCoverage, setHasCoverage] = useState(null); // null = loading, true/false = result
  const [activeLead, setActiveLead] = useState(null); // existing active lead for this quote
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const results = await base44.entities.QuoteCheck.filter({ id });
      if (results.length > 0) {
        setData(results[0]);
        // Check mechanic coverage for the user's area
        const quote = results[0];
        if (quote.state) {
          base44.functions.invoke("checkMechanicCoverage", {
            suburb: quote.suburb || "",
            state: quote.state,
          }).then(res => {
            setHasCoverage(res.data?.has_coverage === true);
          }).catch(() => setHasCoverage(false));
        } else {
          setHasCoverage(false);
        }
        // Check if there's already an active lead for this quote
        base44.entities.MechanicLead.filter({ quote_check_id: results[0].id }).then(leads => {
          const active = leads.find(l => l.status === 'available' && l.available_until && new Date(l.available_until) > new Date());
          if (active) {
            setActiveLead(active);
            setPosted(true);
            setRoutingNote(active.is_major_service
              ? "This is a major/complex job, so your request has been sent to workshop mechanics only."
              : "Your request has been sent to both workshop mechanics and mobile mechanics in your area."
            );
          }
        }).catch(() => {});
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleShare = () => {
    const text = `I just checked a mechanic quote on ServCheck:\n${data.car_year} ${data.car_make} ${data.car_model} — ${data.service_type}\nQuoted: $${data.quoted_price} | Verdict: ${data.verdict?.toUpperCase()}\nFair range: $${data.price_low}-$${data.price_high}`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  const handlePostPublicly = async () => {
    if (posting || posted) return;
    setPosting(true);
    try {
      const res = await base44.functions.invoke("broadcastMechanicLeads", { ...data, id: data.id });
      setPosted(true);
      const isMajor = res?.data?.is_major_service;
      if (isMajor) {
        setRoutingNote("This is a major/complex job, so your request has been sent to workshop mechanics only — mobile mechanics are not equipped for this type of work.");
        toast.success("Sent to local workshops!");
      } else {
        setRoutingNote("Your request has been sent to both workshop mechanics and mobile mechanics in your area.");
        toast.success("Sent to local mechanics!");
      }
    } catch {
      toast.error("Failed to send. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-8 sm:py-12">
        <SEOHead
          title="Your Quote Analysis | ServCheck"
          description="Your mechanic quote analysis results."
          path="/results"
          noindex={true}
        />
        <div className="max-w-2xl mx-auto px-4">
          <EstimateLoader />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Quote not found.</p>
        <Link to="/"><Button className="mt-4">Check a new quote</Button></Link>
      </div>
    );
  }

  const isTooChimp = data.verdict === 'too_cheap' ||
    (data.quoted_price && data.price_low && data.price_low > 0 &&
      (data.quoted_price / data.price_low) < 0.80);

  const isOverpriced = data.verdict === 'ripoff' ||
    (data.quoted_price && data.price_average && data.price_average > 0 &&
      (data.quoted_price - data.price_average) / data.price_average >= 0.25);

  const isHigh = isOverpriced || data.verdict === 'high';

  return (
    <div className="w-full py-8 sm:py-12">
      <SEOHead
        title="Your Quote Analysis | ServCheck"
        description="Your mechanic quote analysis results."
        path="/results"
        noindex={true}
      />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          New check
        </Link>
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>
      </motion.div>

      {/* Car info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl bg-gradient-to-br from-[#1a237e] to-[#1565c0] p-4 mb-6 flex items-center gap-3"
      >
        <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Car className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-heading font-bold text-white leading-tight">
            {data.car_year} {data.car_make} {data.car_model}
          </p>
          <p className="text-blue-200 text-xs mt-0.5 truncate">
            {data.service_type} · {data.suburb ? `${data.suburb}, ` : ""}{data.state}
            {data.odometer ? ` · ${data.odometer.toLocaleString()} km` : ""}
          </p>
        </div>
      </motion.div>

      {/* Results */}
      <div className="space-y-6">
        <VerdictCard data={data} />

        <BullshitMeter score={data.bs_meter} reasoning={data.bs_meter_reasoning} />

        {/* ACTION BUTTONS — overpriced/high quotes */}
        {isHigh && hasCoverage === true && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <div className="rounded-2xl border-2 border-red-400 bg-red-50 p-5">
              <p className="font-heading font-bold text-sm mb-1 text-red-900">Your quote appears above market rate — request a second opinion</p>
              <p className="text-xs text-red-700 mb-3">Send your request to local mechanics so they can provide a competitive alternative quote.</p>
              <Button
                onClick={handlePostPublicly}
                disabled={posting || posted}
                className={`gap-2 w-full ${posted ? "bg-emerald-600 hover:bg-emerald-600 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
              >
                {posting ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending...</> :
                 posted ? "✅ Sent to Local Mechanics" :
                 <><Globe className="h-4 w-4" /> Send to Local Mechanics for a Better Quote</>}
                </Button>
                {posted && routingNote && (
                <p className="text-xs text-red-700 bg-red-100 rounded-xl px-3 py-2 mt-1 leading-relaxed">ℹ️ {routingNote}</p>
                )}
              {posted && (
                <Button
                  onClick={() => navigate("/my-requests")}
                  variant="outline"
                  className="w-full gap-2 border-red-300 text-red-700 hover:bg-red-100"
                >
                  <MessageSquare className="h-4 w-4" />
                  View Mechanic Messages
                </Button>
              )}
            </div>

            {(data.suburb || data.state) && (
              <div className="rounded-2xl border border-red-300 bg-red-50 p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-heading font-bold text-sm text-red-900">Find mechanics nearby</p>
                  <p className="text-xs text-red-700 mt-0.5">
                    Search the directory in {data.suburb ? `${data.suburb}, ` : ""}{data.state}
                  </p>
                </div>
                <Button
                  onClick={() => navigate(`/directory?suburb=${encodeURIComponent(data.suburb || "")}&state=${encodeURIComponent(data.state || "NSW")}`)}
                  className="bg-red-600 hover:bg-red-700 text-white gap-2 flex-shrink-0"
                >
                  <MapPin className="h-4 w-4" />
                  Find Mechanics
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* NO COVERAGE fallback — overpriced quotes */}
        {isHigh && hasCoverage === false && (
          <NoCoveragePanel suburb={data.suburb} state={data.state} />
        )}

        {isTooChimp && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border-2 border-orange-400 bg-orange-50 p-5"
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-heading font-bold text-orange-900 text-sm mb-1">Parts Quality Warning</p>
                <p className="text-sm text-orange-800 leading-relaxed">
                  This quote is well below market rate for a <strong>{data.car_make}</strong>. They are likely using cheap, non-OEM parts or budget tyres. <strong>Do not approve this work until you ask the mechanic for the exact brand name of the parts they are installing.</strong>
                </p>
              </div>
            </div>
          </motion.div>
        )}



        {/* Fair quote message */}
        {!isHigh && data.verdict && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-center text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5"
          >
            ✅ Your quote looks fair. {hasCoverage === true ? "You can still compare prices below." : "No action needed."}
          </motion.p>
        )}

        <CommunityInsight
          serviceType={data.service_type}
          carMake={data.car_make}
          carModel={data.car_model}
          state={data.state}
          suburb={data.suburb}
        />

        {data.acl_warning && (
          <ACLWarning warning={data.acl_warning} text={data.acl_warning_text} />
        )}

        {data.service_necessary_reasoning && (
          <ServiceNecessity necessary={data.service_necessary} reasoning={data.service_necessary_reasoning} />
        )}

        {data.summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <p className="text-sm leading-relaxed text-foreground">{data.summary}</p>
          </motion.div>
        )}

        {/* Soft upgrade suggestion — only when AI mentions a major/comprehensive service upgrade in summary */}
        {data.summary && /major service|comprehensive service|full service|major overhaul/i.test(data.summary) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-300 bg-amber-50 p-5"
          >
            <p className="font-heading font-bold text-amber-900 text-sm mb-1">💡 Worth checking: Major Service pricing</p>
            <p className="text-xs text-amber-800 mb-3">
              Given your car's age or mileage, a Major Service may be recommended. This is just a suggestion — your mechanic is the best person to advise.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-400 text-amber-900 hover:bg-amber-100 text-xs"
              onClick={() => {
                const params = new URLSearchParams({
                  prefill: JSON.stringify({
                    car_make: data.car_make,
                    car_model: data.car_model,
                    car_year: data.car_year,
                    state: data.state,
                    suburb: data.suburb || "",
                    selected_services: ["Major Service"],
                  })
                });
                navigate(`/?${params.toString()}`);
              }}
            >
              Check Major Service price →
            </Button>
          </motion.div>
        )}

        <PriceBreakdown items={data.whats_included} />

        <WhatCanISkip quote={data} />

        {data.verdict !== "fair" && (
          <CounterOffer
            amount={data.counter_offer}
            reasoning={data.counter_offer_reasoning}
            originalPrice={data.quoted_price}
            priceAverage={data.price_average}
          />
        )}

        <MechanicQuestions questions={data.mechanic_questions} />

        {/* ACTION BUTTONS — fair quotes (only if coverage exists) */}
        {!isHigh && hasCoverage === true && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-5"
          >
            <p className="font-heading font-bold text-sm mb-1">Would you like to compare prices?</p>
            <p className="text-xs text-muted-foreground mb-3">Send your request to local mechanics so they can provide a competitive alternative quote.</p>
            <Button
              onClick={handlePostPublicly}
              disabled={posting || posted}
              className={`gap-2 w-full ${posted ? "bg-emerald-600 hover:bg-emerald-600 text-white" : "bg-accent text-accent-foreground hover:bg-accent/90"}`}
            >
              {posting ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending...</> :
               posted ? "✅ Sent to Local Mechanics" :
               <><Globe className="h-4 w-4" /> Send to Local Mechanics for a Better Quote</>}
            </Button>
            {posted && routingNote && (
              <p className="text-xs text-muted-foreground bg-secondary rounded-xl px-3 py-2 mt-1 leading-relaxed">ℹ️ {routingNote}</p>
            )}
            {posted && (
              <Button
                onClick={() => navigate("/my-requests")}
                variant="outline"
                className="w-full gap-2 border-accent/40 text-accent hover:bg-accent/10"
              >
                <MessageSquare className="h-4 w-4" />
                View Mechanic Messages
              </Button>
            )}
          </motion.div>
        )}

        {!isHigh && hasCoverage === true && (data.suburb || data.state) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-accent/30 bg-accent/5 p-5 flex items-center justify-between gap-4"
          >
            <div>
              <p className="font-heading font-bold text-sm">Find mechanics nearby</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Search the directory for mechanics in {data.suburb ? `${data.suburb}, ` : ""}{data.state}
              </p>
            </div>
            <Button
              onClick={() => navigate(`/directory?suburb=${encodeURIComponent(data.suburb || "")}&state=${encodeURIComponent(data.state || "NSW")}`)}
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 flex-shrink-0"
            >
              <MapPin className="h-4 w-4" />
              Find Mechanics
            </Button>
          </motion.div>
        )}

        {/* NO COVERAGE fallback — fair quotes */}
        {!isHigh && hasCoverage === false && (
          <NoCoveragePanel suburb={data.suburb} state={data.state} />
        )}

        {/* Thumbs feedback */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="rounded-2xl border border-border bg-card p-5 text-center"
        >
          <p className="text-sm font-semibold text-foreground mb-3">Was this analysis helpful?</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={async () => {
                if (data.feedback) return;
                await base44.entities.QuoteCheck.update(data.id, { feedback: "helpful" });
                setData(d => ({ ...d, feedback: "helpful" }));
                toast.success("Thanks for your feedback!");
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                data.feedback === "helpful"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-400 hover:bg-emerald-50"
              }`}
            >
              👍 Yes
            </button>
            <button
              onClick={async () => {
                if (data.feedback) return;
                await base44.entities.QuoteCheck.update(data.id, { feedback: "not_helpful" });
                setData(d => ({ ...d, feedback: "not_helpful" }));
                toast.success("Thanks — we'll use this to improve.");
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                data.feedback === "not_helpful"
                  ? "border-red-400 bg-red-50 text-red-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-red-300 hover:bg-red-50"
              }`}
            >
              👎 No
            </button>
          </div>
        </motion.div>

        {/* Disclaimer — quiet but accessible */}
        <SubtleDisclaimer>
          Market estimate only. Prices are based on Australian market data and may vary by vehicle condition, location and
          provider. This report is general information, not professional mechanical or financial advice. Always obtain a
          written quote from a licensed mechanic before authorising any work.
        </SubtleDisclaimer>

        <HomescreenBonusPrompt />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center pt-4"
        >
          <Link to="/">
            <Button variant="outline" size="lg" className="font-heading font-semibold">
              Check another quote
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}