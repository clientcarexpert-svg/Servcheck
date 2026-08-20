import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MapPin, Wrench, X, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Haversine formula
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Rough metro postcode check for Australian states
const METRO_POSTCODES = {
  NSW: [/^2[0-1]\d\d$/, /^2\d{3}$/],  // Sydney metro generally 2000-2239
  VIC: [/^3[0-1]\d\d$/],
  QLD: [/^4[0-1]\d\d$/],
  WA:  [/^6[0-1]\d\d$/],
  SA:  [/^5[0-1]\d\d$/],
  ACT: [/^26\d\d$/],
};

function isMetroSuburb(state, suburb) {
  // Simple heuristic — default to metro for major cities
  const metroKeywords = [
    "sydney","melbourne","brisbane","perth","adelaide","canberra",
    "parramatta","bondi","manly","chatswood","penrith","liverpool",
    "blacktown","hornsby","sutherland","hurstville","bankstown",
    "st kilda","richmond","fitzroy","collingwood","brunswick","footscray",
    "springvale","dandenong","frankston","ringwood","werribee","sunshine",
    "gold coast","sunshine coast","ipswich","logan","redlands",
    "fremantle","joondalup","rockingham","mandurah","armadale",
    "glenelg","salisbury","elizabeth","morphett vale",
  ];
  if (!suburb) return true;
  return metroKeywords.some(k => suburb.toLowerCase().includes(k));
}

async function getUserCoords(suburb, state) {
  const q = encodeURIComponent(`${suburb}, ${state}, Australia`);
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
    { headers: { "Accept-Language": "en" } }
  );
  const data = await res.json();
  if (data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

async function getMechanicCoords(suburb, state) {
  return getUserCoords(suburb, state);
}

export default function LocalMechanicsSection({ quoteData }) {
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMechanic, setSelectedMechanic] = useState(null);
  const [extraMessage, setExtraMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState(new Set());

  useEffect(() => {
    if (!quoteData?.suburb || !quoteData?.state) {
      setLoading(false);
      return;
    }
    loadNearbyMechanics();
  }, [quoteData?.id]);

  const loadNearbyMechanics = async () => {
    setLoading(true);
    try {
      const userCoords = await getUserCoords(quoteData.suburb, quoteData.state);
      if (!userCoords) { setLoading(false); return; }

      // Fetch verified, active mechanics in same state (safe public fields only)
      const res = await base44.functions.invoke("getPublicMechanics", { state: quoteData.state });
      const allMechanics = res.data?.mechanics || [];

      const metro = isMetroSuburb(quoteData.state, quoteData.suburb);
      const workshopRadius = metro ? 15 : 20;

      // Geocode each mechanic and calculate distance from user's suburb
      const withDistance = [];
      for (const m of allMechanics) {
        if (!m.suburb) continue;
        try {
          const coords = await getMechanicCoords(m.suburb, m.state);
          if (!coords) continue;
          const dist = getDistanceKm(userCoords.lat, userCoords.lon, coords.lat, coords.lon);
          withDistance.push({ ...m, _distance: Math.round(dist * 10) / 10, _coords: coords });
        } catch { /* skip */ }
      }

      // Workshops: user must be within workshopRadius of the workshop's suburb
      // Mobile mechanics: user must be within the mechanic's own service_radius_km
      const passesRadius = (m, expandedWorkshopRadius = workshopRadius) => {
        if (m.mechanic_type === "mobile_mechanic") {
          const mobileRadius = m.service_radius_km || 20;
          return m._distance <= mobileRadius;
        }
        return m._distance <= expandedWorkshopRadius;
      };

      let nearby = withDistance
        .filter(m => passesRadius(m))
        .sort((a, b) => a._distance - b._distance)
        .slice(0, 5);

      // Expand workshop radius to 30km if no results
      if (nearby.length === 0) {
        nearby = withDistance
          .filter(m => passesRadius(m, 30))
          .sort((a, b) => a._distance - b._distance)
          .slice(0, 5);
      }

      setMechanics(nearby);
    } catch (err) {
      console.error("Failed to load nearby mechanics", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!selectedMechanic) return;
    setSending(true);
    try {
      await base44.functions.invoke("sendJobToMechanic", {
        mechanic_profile_id: selectedMechanic.id,
        quote_check_id: quoteData.id,
        extra_message: extraMessage || "",
      });

      setSentTo(prev => new Set([...prev, selectedMechanic.id]));
      toast.success(`Your job has been sent to ${selectedMechanic.business_name}. They will be in touch shortly.`);
      setSelectedMechanic(null);
      setExtraMessage("");
    } catch (err) {
      toast.error("Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Finding mechanics near you...
      </div>
    );
  }

  if (mechanics.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div>
        <h3 className="font-heading font-bold text-lg text-[#1a237e]">Local Mechanics Who Can Help</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Send your job directly to a verified mechanic near {quoteData.suburb}, {quoteData.state}.
        </p>
      </div>

      {/* Horizontal scroll on mobile, 3-col grid on desktop */}
      <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible">
        {mechanics.map(m => (
          <div
            key={m.id}
            className="min-w-[230px] sm:min-w-0 rounded-2xl border-2 border-slate-200 bg-white p-4 flex flex-col gap-3 flex-shrink-0"
          >
            <div>
              <p className="font-bold text-sm text-[#1a237e] leading-tight">{m.business_name}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  m.mechanic_type === "workshop"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-orange-100 text-orange-700"
                }`}>
                  {m.mechanic_type === "workshop" ? "Workshop" : "Mobile"}
                </span>
                <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                  <MapPin className="h-2.5 w-2.5" />{m._distance} km away
                </span>
                {m.accepting_bookings === false ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Booked out</span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    Taking bookings now
                  </span>
                )}
              </div>
            </div>

            {m.specialties?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {m.specialties.slice(0, 3).map(s => (
                  <span key={s} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
            )}

            <Button
              size="sm"
              disabled={sentTo.has(m.id)}
              onClick={() => setSelectedMechanic(m)}
              className={`w-full text-xs font-bold rounded-xl mt-auto ${
                sentTo.has(m.id)
                  ? "bg-green-600 text-white"
                  : "bg-[#1a237e] hover:bg-[#283593] text-white"
              }`}
            >
              {sentTo.has(m.id) ? "✓ Sent" : "Send My Job to This Mechanic"}
            </Button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {selectedMechanic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setSelectedMechanic(null); }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-heading font-bold text-base text-[#1a237e]">Send Job to Mechanic</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedMechanic.business_name}</p>
                </div>
                <button onClick={() => setSelectedMechanic(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Job details */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1.5 text-xs">
                <p><span className="font-semibold text-slate-700">Vehicle:</span> {quoteData.car_year} {quoteData.car_make} {quoteData.car_model}</p>
                <p><span className="font-semibold text-slate-700">Service:</span> {quoteData.service_type}</p>
                <p><span className="font-semibold text-slate-700">Location:</span> {quoteData.suburb}, {quoteData.state}</p>
                {quoteData.quoted_price && (
                  <p><span className="font-semibold text-slate-700">Current Quote:</span> ${quoteData.quoted_price}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Add a message <span className="font-normal text-slate-400">(optional)</span></label>
                <textarea
                  value={extraMessage}
                  onChange={e => setExtraMessage(e.target.value)}
                  placeholder="Any extra details for the mechanic..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                />
              </div>

              <Button
                onClick={handleSend}
                disabled={sending}
                className="w-full bg-[#1a237e] hover:bg-[#283593] text-white font-bold rounded-xl h-12 gap-2"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? "Sending..." : "Send Job"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}