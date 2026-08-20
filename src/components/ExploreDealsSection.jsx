import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Phone, MessageSquare, Copy, CheckCheck, ChevronDown, ChevronUp, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function ExploreDealsSection({ carData, verdict }) {
  const [expanded, setExpanded] = useState(false);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageModal, setMessageModal] = useState(null); // { dealer }
  const [copied, setCopied] = useState(false);
  const [contacted, setContacted] = useState(new Set());

  const prefilledMessage = (dealer) =>
    `Hi ${dealer.business_name},\n\nI'm currently looking at a ${carData.car_year} ${carData.car_make} ${carData.car_model} (${parseInt(carData.odometer).toLocaleString()} km) listed for $${parseInt(carData.asking_price).toLocaleString()} in ${carData.suburb || carData.state}.\n\nOur analysis shows the asking price is ${verdict === "overpriced" ? "overpriced" : "on the higher side"} based on current market values.\n\nDo you have a similar or comparable vehicle available at a better price? Happy to discuss.\n\nKind regards`;

  const loadDealers = async () => {
    if (dealers.length > 0) return;
    setLoading(true);
    try {
      const all = await base44.entities.DealerProfile.filter({ state: carData.state, is_active: true });
      setDealers(all.slice(0, 5));
    } catch {
      toast.error("Could not load local dealers.");
    }
    setLoading(false);
  };

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadDealers();
  };

  const handleCopy = async (dealer) => {
    await navigator.clipboard.writeText(prefilledMessage(dealer));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Create a DealerLead record so dealers see this in their dashboard
    if (!contacted.has(dealer.id)) {
      try {
        const user = await base44.auth.me();
        await base44.entities.DealerLead.create({
          quote_check_id: `buycar_${Date.now()}`,
          dealer_id: dealer.dealer_id,
          dealer_profile_id: dealer.id,
          dealer_business_name: dealer.business_name,
          user_email: user?.email || "",
          user_full_name: user?.full_name || "",
          car_make: carData.car_make,
          car_model: carData.car_model,
          car_year: carData.car_year,
          service_type: "Used Car Purchase",
          suburb: carData.suburb || "",
          state: carData.state,
          quoted_price: parseInt(carData.asking_price),
          verdict: verdict,
          credits_spent: 0,
          user_notified: false,
        });
        setContacted(prev => new Set([...prev, dealer.id]));
      } catch {
        // silently ignore — contact still happened
      }
    }
    toast.success("Message copied! Paste it when you call or email the dealer.");
  };

  if (!["fair", "high", "overpriced"].includes(verdict)) return null;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={handleExpand}
        className="w-full flex items-center justify-between p-5 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-blue-700" />
          </div>
          <div className="text-left">
            <p className="font-heading font-bold">Explore Dealership Options</p>
            <p className="text-sm text-muted-foreground">Find local dealers who may have a better deal on this car</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-border">
              <p className="text-xs text-muted-foreground mt-4 mb-4">
                These verified dealers in <strong>{carData.state}</strong> may have a comparable or better-value vehicle. Tap <strong>Copy Message</strong> to get a pre-filled message you can send them.
              </p>

              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-4 border-muted border-t-accent rounded-full animate-spin" />
                </div>
              )}

              {!loading && dealers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No registered dealers in {carData.state} yet.</p>
              )}

              <div className="space-y-3">
                {dealers.map(dealer => (
                  <div key={dealer.id} className="rounded-xl border border-border bg-secondary/20 p-4 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-sm truncate">{dealer.business_name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">{dealer.suburb}, {dealer.state}</span>
                      </div>
                      {dealer.phone && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">{dealer.phone}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setMessageModal(dealer)}
                      className="gap-1.5 bg-accent hover:bg-accent/90 text-white text-xs flex-shrink-0"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Message
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pre-filled message modal */}
      <AnimatePresence>
        {messageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setMessageModal(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-card rounded-2xl w-full max-w-md p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading font-bold">Message Template</h3>
                  <p className="text-xs text-muted-foreground">{messageModal.business_name}</p>
                </div>
                <button onClick={() => setMessageModal(null)} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="bg-secondary/40 rounded-xl p-4 text-sm font-medium whitespace-pre-wrap text-foreground mb-4">
                {prefilledMessage(messageModal)}
              </div>

              <Button
                onClick={() => handleCopy(messageModal)}
                className="w-full gap-2 bg-accent hover:bg-accent/90 text-white font-heading font-bold"
              >
                {copied ? <><CheckCheck className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy Message</>}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">Call or email the dealer and paste this message to kick off the conversation.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}