import { useState, useEffect } from "react";
import SEOHead, { buildLocalBusinessSchema } from "../components/SEOHead";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Search, Phone, MapPin, BookOpen, ExternalLink, ShieldCheck, Star, Send, Loader2 } from "lucide-react";
import moment from "moment";
import QuoteRequestModal from "../components/QuoteRequestModal";

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

export default function MechanicDirectory() {
  const { user } = useAuth();
  const [tab, setTab] = useState("servcheck"); // "servcheck" | "google"
  const [suburb, setSuburb] = useState("");
  const [postcode, setPostcode] = useState("");
  const [state, setState] = useState("NSW");
  const [mechanicType, setMechanicType] = useState("all"); // "all" | "workshop" | "mobile"

  // Google/Near Me results
  const [googleResults, setGoogleResults] = useState([]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleLoadingLive, setGoogleLoadingLive] = useState(false);
  const [googleSearched, setGoogleSearched] = useState(false);

  // ServCheck listed results
  const [scResults, setScResults] = useState([]);
  const [scLoading, setScLoading] = useState(false);
  const [scSearched, setScSearched] = useState(false);

  // Quote request modal (from directory)
  const [quoteModal, setQuoteModal] = useState(null); // mechanic profile data

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSuburb = params.get("suburb");
    const urlState = params.get("state");
    const t = params.get("tab");
    if (t === "servcheck" || t === "google") setTab(t);

    // Priority: URL params > user profile
    const resolvedSuburb = urlSuburb || user?.suburb || "";
    const resolvedState = urlState || user?.state || "NSW";

    if (resolvedSuburb) setSuburb(resolvedSuburb);
    if (resolvedState) setState(resolvedState);

    // Auto-search with resolved values
    runServCheckSearch(resolvedState);
    if (resolvedSuburb) {
      runGoogleSearch(resolvedSuburb, "", resolvedState);
    }
  }, [user]);

  const handleGoogleMapsClick = async (shop) => {
    await base44.entities.DirectoryClick.create({
      business_name: shop.business_name,
      suburb: shop.suburb,
      state: shop.state,
      maps_url: shop.maps_url,
    });
    window.open(shop.maps_url, "_blank", "noopener,noreferrer");
  };

  const runServCheckSearch = async (searchState) => {
    setScLoading(true);
    setScSearched(false);
    try {
      const results = await base44.entities.MechanicProfile.filter(
        { state: searchState, is_active: true, verification_status: "verified" },
        "-subscription_tier",
        50
      );
      results.sort((a, b) => {
        if (a.subscription_tier === "featured" && b.subscription_tier !== "featured") return -1;
        if (b.subscription_tier === "featured" && a.subscription_tier !== "featured") return 1;
        return 0;
      });
      setScResults(results);
    } catch (err) {
      console.error("ServCheck search failed:", err);
    } finally {
      setScLoading(false);
      setScSearched(true);
    }
  };

  const runGoogleSearch = async (searchSuburb, searchPostcode, searchState) => {
    if (!searchSuburb && !searchPostcode) return;
    setGoogleLoading(true);
    setGoogleLoadingLive(false);
    setGoogleSearched(false);

    const suburbQuery = (searchSuburb || searchPostcode).trim();
    const capitalized = suburbQuery.charAt(0).toUpperCase() + suburbQuery.slice(1).toLowerCase();
    let data = await base44.entities.MechanicDirectory.filter(
      { suburb: capitalized, state: searchState },
      "-google_rating",
      50
    );
    if (data.length === 0) {
      data = await base44.entities.MechanicDirectory.filter(
        { suburb: suburbQuery.toLowerCase(), state: searchState },
        "-google_rating",
        50
      );
    }

    if (data.length === 0) {
      setGoogleLoadingLive(true);
      const searchLocation = [searchSuburb, searchPostcode].filter(Boolean).join(" ").trim();
      const fallbackUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchLocation + " mechanic " + searchState + " Australia")}`;
      try {
        const aiResult = await base44.integrations.Core.InvokeLLM({
          prompt: `List up to 8 real car mechanic businesses from Google Maps in ${searchLocation}, ${searchState}, Australia. For each include: business_name, address, phone_number, google_rating (number), review_count (number), maps_url (Google Maps place link). Use ISO date for last_scraped_at.`,
          add_context_from_internet: true,
          model: "gemini_3_flash",
          response_json_schema: {
            type: "object",
            properties: {
              mechanics: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    business_name: { type: "string" },
                    address: { type: "string" },
                    phone_number: { type: "string" },
                    google_rating: { type: "number" },
                    review_count: { type: "number" },
                    maps_url: { type: "string" },
                    last_scraped_at: { type: "string" }
                  }
                }
              }
            }
          }
        });
        if (aiResult.mechanics?.length > 0) {
          const toSave = aiResult.mechanics.map(m => ({
            ...m,
            suburb: capitalized,
            state: searchState,
            maps_url: m.maps_url || fallbackUrl,
          }));
          await base44.entities.MechanicDirectory.bulkCreate(toSave);
          data = toSave.map((m, i) => ({ ...m, id: `live-${i}` }));
        } else {
          data = [{
            id: "fallback",
            business_name: `Mechanics in ${suburbQuery}, ${searchState}`,
            address: `${suburbQuery}, ${searchState}, Australia`,
            maps_url: fallbackUrl,
            suburb: capitalized,
            state: searchState,
          }];
        }
      } catch (err) {
        console.error("Live search failed:", err);
      } finally {
        setGoogleLoadingLive(false);
      }
    }

    data.sort((a, b) => {
      if ((b.google_rating || 0) !== (a.google_rating || 0)) return (b.google_rating || 0) - (a.google_rating || 0);
      return (b.review_count || 0) - (a.review_count || 0);
    });

    setGoogleResults(data);
    setGoogleLoading(false);
    setGoogleSearched(true);
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    if (tab === "google") {
      runGoogleSearch(suburb, postcode, state);
    } else {
      runServCheckSearch(state);
    }
  };

  const handleTabSwitch = (newTab) => {
    setTab(newTab);
    if (newTab === "servcheck" && !scSearched) {
      runServCheckSearch(state);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <SEOHead
        title="Find Trusted Mechanics Near You | ServCheck Mechanic Directory"
        description="Browse community-verified mechanics across Sydney, Melbourne, Brisbane and beyond. Compare pricing and reviews from real car owners."
        path="/directory"
        schema={[
          ...(scResults.length > 0 ? scResults.map(buildLocalBusinessSchema) : []),
          ...(googleResults.length > 0 ? googleResults.filter(s => s.google_rating).map(buildLocalBusinessSchema) : []),
        ]}
      />
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Find a Mechanic</p>
        <h1 className="font-heading font-black text-3xl text-[#1a237e] mb-1.5 leading-tight">Mechanic Directory</h1>
        <p className="text-slate-500 text-sm">Find ServCheck-listed mechanics or search Google Maps nearby.</p>
      </motion.div>

      {/* Tab toggle */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => handleTabSwitch("servcheck")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === "servcheck" ? "bg-white text-[#1a237e] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <ShieldCheck className="h-4 w-4" />
          ServCheck Listed
        </button>
        <button
          onClick={() => handleTabSwitch("google")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === "google" ? "bg-white text-[#1a237e] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <MapPin className="h-4 w-4" />
          Google Maps
        </button>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="space-y-3 mb-6">
        <div className="flex gap-2">
          <Select value={state} onValueChange={(val) => { setState(val); if (tab === "servcheck") runServCheckSearch(val); }}>
            <SelectTrigger className="w-24 h-11 bg-secondary/50 border-0 font-medium flex-shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          {tab === "google" && (
            <>
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Suburb (e.g. Auburn)"
                  value={suburb}
                  onChange={e => setSuburb(e.target.value)}
                  className="h-11 pl-9 bg-secondary/50 border-0 font-medium"
                />
              </div>
              <Input
                placeholder="Postcode"
                value={postcode}
                onChange={e => setPostcode(e.target.value)}
                className="h-11 w-24 bg-secondary/50 border-0 font-medium flex-shrink-0"
                maxLength={4}
              />
            </>
          )}
        </div>

        {tab === "servcheck" && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMechanicType("all")}
              className={`flex-1 h-10 rounded-lg text-sm font-semibold transition-all ${mechanicType === "all" ? "bg-[#1a237e] text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              All Mechanics
            </button>
            <button
              type="button"
              onClick={() => setMechanicType("workshop")}
              className={`flex-1 h-10 rounded-lg text-sm font-semibold transition-all ${mechanicType === "workshop" ? "bg-[#1a237e] text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              Workshops
            </button>
            <button
              type="button"
              onClick={() => setMechanicType("mobile")}
              className={`flex-1 h-10 rounded-lg text-sm font-semibold transition-all ${mechanicType === "mobile" ? "bg-[#1a237e] text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              Mobile Mechanics
            </button>
          </div>
        )}

        <Button
          type="submit"
          disabled={tab === "google" ? (googleLoading || (!suburb.trim() && !postcode.trim())) : scLoading}
          className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
        >
          <Search className="h-4 w-4" />
          {tab === "servcheck" ? `Search ${state}` : "Search Mechanics"}
        </Button>
      </form>

      {/* ── ServCheck Tab ── */}
      {tab === "servcheck" && (
        <>
          {scLoading && (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 border-4 border-muted border-t-accent rounded-full animate-spin" />
            </div>
          )}

          {scSearched && !scLoading && scResults.length === 0 && (
            <div className="text-center py-16">
              <ShieldCheck className="h-9 w-9 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No ServCheck mechanics in {state} yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Try a different state or check back soon.</p>
            </div>
          )}

          {scResults.length > 0 && (
            <div className="space-y-4">
              {(() => {
                const filtered = mechanicType === "all" ? scResults : scResults.filter(m => {
                  if (mechanicType === "mobile") return m.mechanic_type === "mobile_mechanic";
                  if (mechanicType === "workshop") return m.mechanic_type !== "mobile_mechanic";
                  return true;
                });
                return (
                  <>
                    <p className="text-xs text-muted-foreground">{filtered.length} mechanic{filtered.length !== 1 ? "s" : ""} found in {state}</p>
                    <div className="space-y-4">
                      {filtered.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all ${m.subscription_tier === "featured" ? "border-amber-300 bg-amber-50" : "border-slate-100 bg-white"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-heading font-bold text-base leading-tight">{m.business_name}</h3>
                        {m.subscription_tier === "featured" && (
                          <span className="text-[11px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            <Star className="h-2.5 w-2.5" /> Featured
                          </span>
                        )}
                        <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <ShieldCheck className="h-2.5 w-2.5" /> ServCheck Listed
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {m.suburb}, {m.state} · {m.mechanic_type === "mobile_mechanic" ? "Mobile Mechanic" : "Workshop"}
                      </p>
                      {m.bio && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{m.bio}</p>}
                      {m.specialties?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {m.specialties.slice(0, 4).map(s => (
                            <span key={s} className="text-[11px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{s}</span>
                          ))}
                          {m.specialties.length > 4 && <span className="text-[11px] text-muted-foreground">+{m.specialties.length - 4}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {m.phone && (
                      <a href={`tel:${m.phone}`} className="flex-1">
                        <Button variant="outline" className="w-full gap-2 h-10 text-sm">
                          <Phone className="h-4 w-4" /> Call
                        </Button>
                      </a>
                    )}
                    <Button
                      onClick={() => setQuoteModal(m)}
                      className="flex-1 bg-accent text-white hover:bg-accent/90 gap-2 h-10 text-sm"
                    >
                      <Send className="h-4 w-4" /> Ask
                    </Button>
                  </div>
                  </motion.div>
                      ))}
                    </div>
                  </>
                  );
                  })()}
                  </div>
                  )}
                  </>
                  )}

      {/* ── Google/Near Me Tab ── */}
      {tab === "google" && (
        <>
          <p className="text-xs text-muted-foreground mb-4 bg-secondary/50 px-3 py-2 rounded-lg">
            ℹ️ Results from Google Maps. ServCheck does not endorse or verify these businesses.
          </p>

          {googleLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-7 h-7 border-4 border-muted border-t-accent rounded-full animate-spin" />
              {googleLoadingLive && (
                <p className="text-sm text-muted-foreground animate-pulse">Searching Google Maps live for mechanics in {suburb || postcode}…</p>
              )}
            </div>
          )}

          {googleSearched && !googleLoading && googleResults.length === 0 && (
            <div className="text-center py-16">
              <BookOpen className="h-9 w-9 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No mechanics found for {suburb || postcode}, {state}.</p>
              <p className="text-xs text-muted-foreground mt-1">Try a different suburb or postcode.</p>
            </div>
          )}

          {googleResults.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">{googleResults.length} mechanic{googleResults.length !== 1 ? "s" : ""} found in {suburb || postcode}, {state}</p>
              {googleResults.map((shop, i) => (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all p-5"
                >
                  <h3 className="font-heading font-bold text-lg leading-tight">{shop.business_name}</h3>

                  {shop.address && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-start gap-1.5">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      {shop.address}
                    </p>
                  )}

                  {shop.google_rating && (
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className="text-sm font-semibold">
                        ⭐ {shop.google_rating.toFixed(1)}
                        {shop.review_count ? ` (${shop.review_count.toLocaleString()} reviews)` : ""}
                      </span>
                      {shop.maps_url && (
                        <button
                          onClick={() => handleGoogleMapsClick(shop)}
                          className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-medium"
                        >
                          <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-white border border-border text-[10px] font-bold text-blue-600">G</span>
                          View on Google Maps
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {shop.phone_number && (
                    <a href={`tel:${shop.phone_number}`} className="mt-4 inline-flex">
                      <Button className="bg-primary text-primary-foreground gap-2 h-10">
                        <Phone className="h-4 w-4" />
                        Call Shop — {shop.phone_number}
                      </Button>
                    </a>
                  )}

                  {shop.last_scraped_at && (
                    <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
                      Rating as of {moment(shop.last_scraped_at).format("MMMM YYYY")} via Google.
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Quote request modal triggered from ServCheck listing */}
      {quoteModal && (
        <QuoteRequestModal
          preselectedMechanic={quoteModal}
          onClose={() => setQuoteModal(null)}
        />
      )}
    </div>
  );
}