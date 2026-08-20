import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import SEOHead from "../components/SEOHead";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Phone, Search, Star, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function LocalAlternatives() {
  const [suburb, setSuburb] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!suburb.trim()) return;
    setLoading(true);
    setSearched(true);
    const all = await base44.entities.Workshop.list();
    const filtered = all.filter(w =>
      w.suburb?.toLowerCase().includes(suburb.trim().toLowerCase())
    );
    // Pro shops first, then free shops alphabetically
    const sorted = [
      ...filtered.filter(w => w.subscription_tier === "pro"),
      ...filtered.filter(w => w.subscription_tier !== "pro").sort((a, b) => a.business_name.localeCompare(b.business_name)),
    ];
    setResults(sorted);
    setLoading(false);
  };

  const trackView = async (workshop) => {
    await base44.functions.invoke('trackWorkshopView', { workshop_id: workshop.id });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <SEOHead
        title="Find a Second Opinion — Local Mechanic Alternatives Near You | ServCheck"
        description="Got a quote that seems too high? Find alternative mechanics near you and compare pricing instantly."
        path="/local-alternatives"
      />
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-heading font-bold text-3xl mb-1">The Independent Grid</h1>
        <p className="text-muted-foreground">Find local alternatives for a second opinion.</p>
      </motion.div>

      {/* Legal disclaimer */}
      <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 mb-6 text-sm text-amber-900">
        <strong>Disclaimer:</strong> These workshops are self-listed. ServCheck does not verify workmanship or pricing.
      </div>

      <div className="space-y-4">
        {results.map((w, i) => (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            {w.subscription_tier === "pro" ? (
              <ProCard workshop={w} onView={trackView} />
            ) : (
              <FreeCard workshop={w} onView={trackView} />
            )}
          </motion.div>
        ))}
      </div>

      {!searched && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Enter your suburb above to find nearby independent mechanics.</p>
          <p className="text-sm mt-2">Are you a mechanic? <Link to="/partner-signup" className="text-accent underline">List your workshop for free →</Link></p>
        </div>
      )}
    </div>
  );
}

function ProCard({ workshop, onView }) {
  const [clicked, setClicked] = useState(false);

  const handleCall = () => {
    if (!clicked) {
      onView(workshop);
      setClicked(true);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
             <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Premium</span>
            </div>
          <h3 className="font-heading font-bold text-lg">{workshop.business_name}</h3>
        </div>
        <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0">
          <ShieldCheck className="h-3.5 w-3.5" />
          Verified ABN
        </div>
      </div>
      <div className="flex items-start gap-1.5 text-sm text-muted-foreground mb-3">
        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>{workshop.address}, {workshop.suburb}, {workshop.state}</span>
      </div>
      {workshop.specialties?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {workshop.specialties.map(s => (
            <span key={s} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">{s}</span>
          ))}
        </div>
      )}
      <a href={`tel:${workshop.landline_number}`} onClick={handleCall}>
        <Button className="w-full bg-accent text-white font-semibold h-11 gap-2">
          <Phone className="h-4 w-4" />
          {workshop.landline_number}
        </Button>
      </a>
    </div>
  );
}

function FreeCard({ workshop, onView }) {
  const [revealed, setRevealed] = useState(false);

  const handleReveal = () => {
    if (!revealed) {
      onView(workshop);
      setRevealed(true);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-heading font-bold text-base mb-1">{workshop.business_name}</h3>
      <div className="flex items-start gap-1.5 text-sm text-muted-foreground mb-3">
        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>{workshop.address}, {workshop.suburb}, {workshop.state}</span>
      </div>
      {revealed ? (
        <p className="text-sm font-medium">{workshop.landline_number}</p>
      ) : (
        <button onClick={handleReveal} className="text-sm text-accent underline font-medium">
          Show phone number
        </button>
      )}
    </div>
  );
}