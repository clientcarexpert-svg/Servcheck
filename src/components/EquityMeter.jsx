import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, Lock, Loader2, FileText, Shield, AlertCircle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";


const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function isStale(profile) {
  if (!profile.last_valuation_date) return true;
  return Date.now() - new Date(profile.last_valuation_date).getTime() > WEEK_MS;
}

export default function EquityMeter({ profile, onUpdated }) {
  const navigate = useNavigate();
  const [locked, setLocked] = useState(true);
  const [odometer, setOdometer] = useState("");
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [valuation, setValuation] = useState(
    !isStale(profile) ? { low: profile.valuation_low, high: profile.valuation_high, avg: profile.last_valuation } : null
  );
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  // If not stale, show unlocked
  useEffect(() => {
    if (!isStale(profile) && profile.last_valuation) {
      setLocked(false);
      setValuation({ low: profile.valuation_low, high: profile.valuation_high, avg: profile.last_valuation });
    }
  }, [profile]);

  const handleOdometerChange = (e) => {
    const val = e.target.value;
    setOdometer(val);
    setTyping(true);
    clearTimeout(timerRef.current);
    // After 3 seconds of continuous typing, run valuation
    timerRef.current = setTimeout(() => {
      if (val && parseInt(val) > 0) {
        runValuation(parseInt(val));
      }
    }, 3000);
  };

  const runValuation = async (km) => {
    setLoading(true);
    try {
      // Fetch logbook entries to build a service history context for valuation
      let serviceLines = "No service history on file";
      try {
        const logEntries = await base44.entities.LogbookEntry.filter(
          { car_make: profile.car_make, car_model: profile.car_model, car_year: profile.car_year },
          '-service_date', 20
        );
        if (logEntries.length > 0) {
          serviceLines = logEntries.map(e =>
            `- ${e.service_date || 'unknown date'}: ${e.service_type || 'Service'} at ${(e.odometer || 0).toLocaleString()} km, cost $${e.cost || 0}${(e.parts_replaced || []).length ? `, parts: ${e.parts_replaced.map(p => p.part).join(', ')}` : ''}`
          ).join('\n');
        }
      } catch (_) {}

      const serviceHistoryContext = `SERVICE HISTORY (from verified receipts):
${serviceLines}

VALUATION RULES based on service history:
- Regular maintenance (oil, filters, brakes, tyres) done on schedule → positive adjustment, car holds value well.
- Major repairs (engine, gearbox, timing belt) → slight negative adjustment as it may signal past issues.
- No history or gaps → treat as unknown history, apply standard market discount.
- Services done on time (every ~12 months or 15,000 km) → positive adjustment vs unknown-history car.`;

      // --- Try DB first: find a recent UsedCarCheck for the same make/model/year/state ---
      let dbPrices = null;
      try {
        const cached = await base44.entities.UsedCarCheck.filter(
          { car_make: profile.car_make, car_model: profile.car_model, car_year: profile.car_year, state: profile.state },
          '-created_date',
          1
        );
        if (cached.length > 0 && cached[0].market_price_average) {
          const ageDays = (Date.now() - new Date(cached[0].created_date).getTime()) / 86400000;
          if (ageDays < 30) {
            dbPrices = {
              market_price_low: cached[0].market_price_low,
              market_price_average: cached[0].market_price_average,
              market_price_high: cached[0].market_price_high,
            };
          }
        }
      } catch (_) {}

      let res;
      if (dbPrices) {
        res = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert Australian used car valuator.

CAR: ${profile.car_year} ${profile.car_make} ${profile.car_model}
CURRENT ODOMETER: ${km.toLocaleString()} km
STATE: ${profile.state || "NSW"}

${serviceHistoryContext}

BASE MARKET DATA FROM OUR DATABASE (for a typical example of this car):
- Base Price Low: $${dbPrices.market_price_low?.toLocaleString()}
- Base Price Average: $${dbPrices.market_price_average?.toLocaleString()}
- Base Price High: $${dbPrices.market_price_high?.toLocaleString()}

Adjust these base prices for this car's specific odometer and service history above. Return precise adjusted numbers in AUD.`,
          add_context_from_internet: false,
          response_json_schema: {
            type: "object",
            properties: {
              market_price_low: { type: "number" },
              market_price_average: { type: "number" },
              market_price_high: { type: "number" }
            }
          }
        });
      } else {
        res = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert Australian used car valuator. Estimate the current private sale resale value for:
- ${profile.car_year} ${profile.car_make} ${profile.car_model}
- Odometer: ${km.toLocaleString()} km
- State: ${profile.state || "NSW"}

${serviceHistoryContext}

Search CarsGuide, Carsales, and RedBook for current Australian market data. Return precise numbers in AUD, no rounding to the nearest 5000.`,
          add_context_from_internet: true,
          model: "gemini_3_flash",
          response_json_schema: {
            type: "object",
            properties: {
              market_price_low: { type: "number" },
              market_price_average: { type: "number" },
              market_price_high: { type: "number" }
            }
          }
        });
      }

      const updated = await base44.entities.CarProfile.update(profile.id, {
        last_odometer: km,
        last_valuation: res.market_price_average,
        valuation_low: res.market_price_low,
        valuation_high: res.market_price_high,
        last_valuation_date: new Date().toISOString()
      });

      setValuation({ low: res.market_price_low, high: res.market_price_high, avg: res.market_price_average });
      setLocked(false);
      setTyping(false);
      onUpdated && onUpdated(updated);
      toast.success("Equity updated!");
    } catch (err) {
      toast.error("Valuation failed, try again");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stale = isStale(profile);
  const showBlur = locked || stale;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden shadow-xl border border-slate-200"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a237e] to-[#1565c0] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-heading font-bold text-white text-sm">Equity Meter</p>
            <p className="text-blue-200 text-xs">{profile.car_year} {profile.car_make} {profile.car_model}</p>
          </div>
        </div>
        {profile.is_verified && (
          <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 rounded-full px-3 py-1">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-emerald-300 text-xs font-semibold">Verified</span>
          </div>
        )}
      </div>

      {/* Value display */}
      <div className="bg-white px-5 py-6">
        <div className="relative">
          {showBlur && !loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-md rounded-xl bg-white/60">
              <Lock className="h-6 w-6 text-slate-400 mb-2" />
              <p className="text-xs text-slate-500 font-medium text-center px-4">
                {stale && profile.last_valuation ? "Your weekly value has refreshed — enter your odometer to unlock" : "Enter your odometer to see your car's live value"}
              </p>
            </div>
          )}
          <div className={showBlur && !loading ? "blur-sm select-none pointer-events-none" : ""}>
            {valuation ? (
              <div className="text-center py-2">
                <p className="text-xs text-slate-400 mb-1 uppercase tracking-widest">Current Market Value</p>
                <p className="font-heading font-black text-5xl text-[#1a237e]">
                  ${valuation.avg?.toLocaleString()}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  ${valuation.low?.toLocaleString()} – ${valuation.high?.toLocaleString()} range
                </p>
                {profile.last_valuation_date && (
                  <p className="text-xs text-slate-300 mt-2">
                    Updated {format(new Date(profile.last_valuation_date), "d MMM yyyy")}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-xs text-slate-400 mb-1 uppercase tracking-widest">Current Market Value</p>
                <p className="font-heading font-black text-5xl text-slate-200">$00,000</p>
                <p className="text-sm text-slate-300 mt-1">$00,000 – $00,000 range</p>
              </div>
            )}
          </div>

          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 rounded-xl">
              <Loader2 className="h-6 w-6 text-[#f97316] animate-spin mb-2" />
              <p className="text-xs text-slate-500">Fetching live market data…</p>
            </div>
          )}
        </div>

        {/* Odometer unlock input */}
        {(showBlur || stale) && !loading && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500">Your current odometer (km)</p>
            <div className="relative">
              <Input
                ref={inputRef}
                type="number"
                placeholder="e.g. 87500"
                value={odometer}
                onChange={handleOdometerChange}
                className="h-12 text-center text-lg font-bold bg-slate-50 border-slate-200 pr-16"
              />
              {typing && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="flex gap-0.5">
                    {[0,1,2].map(i => (
                      <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, delay: i * 0.2, duration: 0.8 }} className="h-1.5 w-1.5 rounded-full bg-[#f97316]" />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 text-center">Keep typing — unlocks automatically after 3 seconds</p>
          </div>
        )}

        {/* Action buttons */}
        {!showBlur && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => { setLocked(true); setOdometer(""); setTyping(false); }}
              className="h-9 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Lock className="h-3.5 w-3.5" /> Update Reading
            </button>
            <button
              onClick={async () => {
                const { jsPDF } = await import("jspdf");
                const doc = new jsPDF();
                const title = `${profile.car_year} ${profile.car_make} ${profile.car_model}`;
                const today = format(new Date(), "d MMM yyyy");

                // Header band
                doc.setFillColor(26, 35, 126);
                doc.rect(0, 0, 210, 32, "F");
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(18);
                doc.setFont("helvetica", "bold");
                doc.text("ServCheck — Vehicle Equity Report", 14, 14);
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text(`Generated: ${today}`, 14, 24);

                // Vehicle title
                doc.setTextColor(26, 35, 126);
                doc.setFontSize(16);
                doc.setFont("helvetica", "bold");
                doc.text(title, 14, 46);
                if (profile.variant) {
                  doc.setFontSize(11);
                  doc.setFont("helvetica", "normal");
                  doc.setTextColor(100, 100, 100);
                  doc.text(profile.variant, 14, 54);
                }

                // Market Value box
                doc.setFillColor(240, 245, 255);
                doc.roundedRect(14, 60, 182, 38, 4, 4, "F");
                doc.setTextColor(100, 100, 100);
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                doc.text("CURRENT MARKET VALUE", 20, 72);
                doc.setTextColor(26, 35, 126);
                doc.setFontSize(28);
                doc.setFont("helvetica", "bold");
                doc.text(`$${valuation?.avg?.toLocaleString() || "—"}`, 20, 88);
                if (valuation?.low && valuation?.high) {
                  doc.setFontSize(10);
                  doc.setFont("helvetica", "normal");
                  doc.setTextColor(120, 120, 120);
                  doc.text(`Range: $${valuation.low.toLocaleString()} – $${valuation.high.toLocaleString()}`, 120, 88);
                }

                // Details table
                let y = 112;
                const rows = [
                  ["Make", profile.car_make],
                  ["Model", profile.car_model],
                  ["Year", profile.car_year],
                  ["Variant", profile.variant || "—"],
                  ["Odometer", profile.last_odometer ? `${profile.last_odometer.toLocaleString()} km` : "—"],
                  ["State", profile.state || "—"],
                  ["Fuel Type", profile.fuel_type || "—"],
                  ["Transmission", profile.transmission || "—"],
                  ["Service History", profile.service_history ? profile.service_history.replace("_", " ") : "—"],
                  ["Last Service Date", profile.last_service_date || "—"],
                  ["Last Service Km", profile.last_service_odometer ? `${profile.last_service_odometer.toLocaleString()} km` : "—"],
                  ["Valuation Updated", profile.last_valuation_date ? format(new Date(profile.last_valuation_date), "d MMM yyyy") : "—"],
                  ["Service History Verified", profile.is_verified ? "Yes ✓" : "No"],
                ];

                doc.setFontSize(10);
                rows.forEach((row, i) => {
                  const bg = i % 2 === 0;
                  if (bg) {
                    doc.setFillColor(248, 248, 252);
                    doc.rect(14, y - 5, 182, 10, "F");
                  }
                  doc.setTextColor(100, 100, 100);
                  doc.setFont("helvetica", "normal");
                  doc.text(row[0], 18, y);
                  doc.setTextColor(30, 30, 30);
                  doc.setFont("helvetica", "bold");
                  doc.text(row[1], 100, y);
                  y += 10;
                });

                if (profile.known_issues) {
                  y += 6;
                  doc.setTextColor(180, 60, 60);
                  doc.setFontSize(9);
                  doc.setFont("helvetica", "bold");
                  doc.text("Known Issues:", 14, y);
                  doc.setFont("helvetica", "normal");
                  doc.setTextColor(80, 80, 80);
                  const issueLines = doc.splitTextToSize(profile.known_issues, 170);
                  y += 6;
                  doc.text(issueLines, 14, y);
                  y += issueLines.length * 6;
                }

                // Footer
                doc.setFillColor(26, 35, 126);
                doc.rect(0, 282, 210, 15, "F");
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.text("ServCheck — serv-check-now.base44.app | This report is for personal reference only.", 14, 291);

                doc.save(`ServCheck_${profile.car_make}_${profile.car_model}_${profile.car_year}.pdf`);
                toast.success("Report downloaded!");
              }}
              className="h-9 rounded-lg bg-[#1a237e] text-white text-xs font-semibold hover:bg-[#1565c0] transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" /> Generate Report
            </button>
          </div>
        )}
      </div>

      {/* Receipt verification strip */}
      <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 flex items-center justify-between">
        {profile.is_verified ? (
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs font-semibold">Service history verified — buyers trust this car</span>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full gap-3">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs font-medium">Verify your service history to boost value</span>
            </div>
            <button
              onClick={() => navigate("/logbook")}
              className="flex-shrink-0 flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Upload Receipt
            </button>
          </div>
        )}
      </div>

      {/* AI Disclaimer */}
      <div className="px-5 py-2 bg-slate-50 border-t border-slate-100">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          ⚠️ Estimate only — based on current market data. Not a professional valuation. Actual market value may vary.
        </p>
      </div>


    </motion.div>
  );
}