import { useState, useEffect, useRef } from "react";
import SEOHead from "../components/SEOHead";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const FAQS = [
  {
    category: "About ServCheck",
    questions: [
      {
        q: "What is ServCheck?",
        a: "ServCheck is an Australian-built platform that takes the guesswork out of car ownership. We help everyday drivers check if a mechanic's quote is fair, track their car's full service history in a digital logbook, find trusted local mechanics, and know exactly what their car is worth before they buy or sell. It's everything you wish you had the last time a mechanic handed you a $2,400 invoice and said \"trust me, mate.\"",
      },
      {
        q: "Why does ServCheck exist?",
        a: "Because the Australian car repair industry has a transparency problem. Quotes for the same job can vary by hundreds — sometimes thousands — of dollars between workshops in the same suburb. Most drivers have no way to tell if they're being charged a fair price or getting taken for a ride. ServCheck was built to level that playing field — giving drivers the same pricing intelligence and market data that the trade has always had to itself.",
      },
      {
        q: "How does ServCheck work?",
        a: "It's simple. Enter your car's make, model, year, and the service or repair you've been quoted for. Our pricing engine analyses your quote against real market data — community-submitted prices, cached workshop rates, advertised franchise prices, and parts retail data — and gives you a clear verdict: Fair, High, or Ripoff. You also get a price range for what the job should cost, a Market Variance Indicator score, and the option to request quotes directly from verified local mechanics.",
      },
      {
        q: "What does ServCheck offer?",
        a: "ServCheck is a complete car ownership toolkit: 1) Quote Check — instant independent pricing analysis of any mechanic quote. 2) Digital Logbook — track every service, part, and reminder in one place. 3) Car Buyer Check — market-verified valuation before you buy a used car, so you don't overpay. 4) Equity Meter — live market value for your current car. 5) Mechanic Directory — find verified, community-rated workshops near you. 6) Mobile Mechanic Quotes — request quotes from mobile mechanics that come to you. 7) Community Prices — see what other Aussies are paying for the same job in your suburb.",
      },
      {
        q: "Who is ServCheck for?",
        a: "ServCheck is for every Australian who owns or is about to own a car. Whether you're a first-time buyer trying not to get burned, a parent managing the family car's servicing, a tradie keeping a ute on the road, or a senior who's tired of being talked down to by workshops — ServCheck gives you the data and confidence to make the right call. We're independent. We don't take kickbacks from workshops. We work for the driver.",
      },
      {
        q: "Is ServCheck free to use?",
        a: "Yes — there's a free tier. You get free credits when you sign up, and you can earn more by uploading past service receipts (2 credits each, up to twice a month) or by referring friends. Each quote check costs 5 credits. Premium subscription ($14.99/month) unlocks Car Buyer Check, Equity Meter, and 75 credits a month for heavy users. The Digital Logbook, Mechanic Directory, and Community Prices are free for everyone.",
      },
      {
        q: "Is ServCheck available across all of Australia?",
        a: "Yes. ServCheck covers all Australian states and territories — NSW, VIC, QLD, WA, SA, TAS, ACT, and NT. Pricing data is localised to your region, postcode where possible, so results reflect your local market rates — not a national average.",
      },
      {
        q: "How is ServCheck different from Google reviews or asking around?",
        a: "Google reviews tell you if a workshop is friendly. They don't tell you if the $890 brake job they just quoted you is fair. ServCheck gives you the actual numbers — what the parts cost retail, what labour should be for that job, what other drivers paid in your area, and what franchise chains are advertising. It's the difference between a vibe check and a data check.",
      },
      {
        q: "Who built ServCheck?",
        a: "ServCheck was built in Australia by a small independent team who got sick of watching friends, family, and themselves get overcharged on car repairs. We're not a workshop chain. We're not owned by an insurer or a dealer group. We're a consumer-side tool — built for drivers, funded by drivers (through subscriptions and credits), and accountable to drivers.",
      },
      {
        q: "How do I get in touch?",
        a: "We'd love to hear from you. Whether you've spotted a dodgy quote, want to suggest a feature, or you're a mechanic who wants to join the directory — head to the Partner Signup page or use the in-app feedback options in Settings. Every message gets read.",
      },
    ],
  },
  {
    category: "Checking Your Quote",
    questions: [
      {
        q: "How accurate is the quote analysis?",
        a: "Our analysis draws from a combination of real community-submitted prices, cached market data, and real-time pricing intelligence. Results are indicative and based on typical Australian market rates for your car make, model, and location. Individual prices can vary based on complexity, parts brand, and workshop quality.",
      },
      {
        q: "What services can I check?",
        a: "You can check virtually any car service — logbook services, brake replacements, tyre changes, transmission work, air conditioning regas, suspension repairs, engine diagnostics, and more. If your mechanic quoted it, you can check it.",
      },
      {
        q: "What information do I need to check a quote?",
        a: "You'll need your car's make, model, year, the service type you've been quoted for, the quoted price, and your state. Optionally, adding your suburb and odometer reading gives you more accurate results.",
      },
      {
        q: "What do the verdicts mean?",
        a: "'Fair' means the quote is within the typical price range for your car and location. 'High' means the price is above average but not outrageous. 'Ripoff' means the quote is significantly above market rate and you should seek a second opinion.",
      },
      {
        q: "What is the Market Variance Indicator?",
        a: "The Market Variance Indicator is a 1–10 score that rates how far a quote sits from typical Australian market rates based on the price, what's included, and known pricing patterns for that service. A score of 7 or above is a red flag and suggests you should push back or get another quote.",
      },
    ],
  },
  {
    category: "Credits",
    questions: [
      {
        q: "How do credits work?",
        a: "Each quote check costs 1 credit. You receive free credits when you sign up. You can earn more by uploading past service receipts (2 credits each, up to twice per month) or by referring friends. You can also purchase credit bundles.",
      },
      {
        q: "How do I earn free credits?",
        a: "Upload a photo of any past mechanic receipt or invoice via the Logbook page — you'll earn 2 credits per upload, up to twice per month. You can also earn credits by referring friends using your unique referral link.",
      },
      {
        q: "Do credits expire?",
        a: "No, your credits do not expire. They stay in your account until you use them.",
      },
    ],
  },
  {
    category: "Digital Logbook",
    questions: [
      {
        q: "What is the Digital Logbook?",
        a: "The Digital Logbook lets you record every service your car has had — date, odometer, cost, parts replaced, and the mechanic's name. It helps you track maintenance history, get service reminders, and build a verified service record that can increase your car's resale value.",
      },
      {
        q: "Can I upload a receipt to auto-fill the logbook?",
        a: "Yes. On the Logbook page, tap 'Earn 2 Free Credits' and upload a photo of your receipt. Our pricing engine will automatically extract the service date, odometer, cost, mechanic name, and parts replaced — and add the entry to your logbook. Your original image is permanently discarded for privacy.",
      },
      {
        q: "Is my receipt data private?",
        a: "Yes. When you upload a receipt, our system extracts only the service-related data (date, odometer, cost, parts) and immediately discards the original image. Your name, address, payment details, and any other personal information are never stored.",
      },
    ],
  },
  {
    category: "Mechanics & Directory",
    questions: [
      {
        q: "How do I find a trusted mechanic near me?",
        a: "Go to the Directory page and search by suburb or state. You'll see mechanics and workshops listed on ServCheck, with community-verified ratings and service specialties. You can also use the Mechanics page to request mobile mechanic quotes.",
      },
      {
        q: "What is a mobile mechanic?",
        a: "A mobile mechanic travels to your home or workplace to diagnose or service your car. They give you a written report so you know exactly what's wrong before committing to any repairs — no workshop, no waiting room, no pressure.",
      },
      {
        q: "Can I list my workshop on ServCheck?",
        a: "Yes! Go to the Partner Signup page to list your workshop for free. You'll appear in the ServCheck directory and can receive leads from local car owners. A Featured listing is available for workshops that want to appear at the top of search results.",
      },
    ],
  },
  {
    category: "Data Sources",
    questions: [
      {
        q: "Where does ServCheck's pricing data come from?",
        a: "ServCheck pricing data is sourced from publicly available Australian automotive service pricing across major national chains and independent workshops, supplemented by anonymous community-reported quotes from Australian drivers. All pricing is specific to your vehicle make, model, and state. ServCheck does not guarantee pricing accuracy and results should be used as a guide only.",
      },
    ],
  },
  {
    category: "Privacy & Trust",
    questions: [
      {
        q: "Is my data safe with ServCheck?",
        a: "Yes. ServCheck is built with privacy by design. We never sell your data. Receipt images are discarded after processing. Your personal details are never shared with mechanics without your explicit consent.",
      },
      {
        q: "Are the community prices real?",
        a: "All community-submitted prices go through automated moderation to detect spam, off-topic content, and defamatory language. Prices submitted with a receipt photo are marked as 'Verified'. The feed shows only factual data — car, service, price — with no reviews or opinions.",
      },
    ],
  },
];

function FAQItem({ q, a, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left group"
      >
        <span className="font-semibold text-sm text-slate-800 group-hover:text-[#1a237e] transition-colors leading-snug">
          {q}
        </span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-slate-600 leading-relaxed pb-4">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.flatMap(section =>
    section.questions.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    }))
  ),
};

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function FAQ() {
  const location = useLocation();
  const aboutRef = useRef(null);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    }
  }, [location.hash]);

  const openAbout = location.hash === "#about-servcheck";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
      <SEOHead
        title="Frequently Asked Questions | ServCheck Australia"
        description="Got questions about ServCheck? Learn how quote checks work, how credits are earned, what the Digital Logbook does, and how to find trusted mechanics near you."
        path="/faq"
        schema={FAQ_SCHEMA}
      />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-500 uppercase tracking-wide mb-5">
          <HelpCircle className="h-3.5 w-3.5 text-slate-400" /> Help Centre
        </div>
        <h1 className="font-heading font-black text-4xl text-[#1a237e] mb-3 leading-tight">
          Frequently Asked<br />
          <span className="text-[#f97316]">Questions</span>
        </h1>
        <p className="text-slate-500 text-base leading-relaxed max-w-md mx-auto">
          Everything you need to know about ServCheck — how it works, credits, privacy, and more.
        </p>
      </motion.div>

      {/* FAQ Sections */}
      <div className="space-y-6">
        {FAQS.map((section, si) => {
          const sectionId = slugify(section.category);
          const isAboutSection = sectionId === "about-servcheck";
          return (
            <motion.div
              key={section.category}
              id={sectionId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.07 }}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden scroll-mt-20"
            >
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{section.category}</p>
              </div>
              <div className="px-5">
                {section.questions.map(({ q, a }) => (
                  <FAQItem key={q} q={q} a={a} defaultOpen={isAboutSection && openAbout} />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 rounded-2xl bg-gradient-to-br from-[#1a237e] to-[#1565c0] p-6 text-center"
      >
        <p className="font-heading font-bold text-white text-lg mb-1">Still have questions?</p>
        <p className="text-blue-200 text-sm mb-4">Check your quote now — it only takes 60 seconds.</p>
        <Link
          to="/check-quote"
          className="inline-flex items-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-white font-heading font-bold text-sm px-6 py-3 rounded-xl transition-colors"
        >
          Check My Quote
        </Link>
      </motion.div>
    </div>
  );
}