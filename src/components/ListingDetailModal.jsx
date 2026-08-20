import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2, MessageSquare, Send, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ListingDetailModal({ listing, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usedCarCheck, setUsedCarCheck] = useState(null);
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const handleContactSeller = async () => {
    if (!message.trim()) return;
    setSendingMessage(true);
    try {
      await base44.entities.QuoteRequest.create({
        mechanic_email: listing.seller_email,
        mechanic_profile_id: listing.id,
        mechanic_business_name: `${listing.car_year} ${listing.car_make} ${listing.car_model} — Seller`,
        user_email: user.email,
        car_make: listing.car_make,
        car_model: listing.car_model,
        car_year: listing.car_year,
        service_type: "Marketplace Inquiry",
        suburb: listing.suburb,
        state: listing.state,
        notes: message,
        status: "pending",
        conversation: [{ role: "user", message, timestamp: new Date().toISOString() }],
      });
      toast.success("Message sent! Check your Messages tab for replies.");
      setShowMessageInput(false);
      setMessage("");
      onClose();
      navigate("/my-requests");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const triggerUsedCarCheck = async () => {
    setLoadingCheck(true);
    try {
      // Deduct 5 credits
      const deductRes = await base44.functions.invoke("deductCredits", { amount: 5, reason: "Marketplace Buyer Analysis" });
      if (deductRes.data?.error) {
        toast.error(deductRes.data.error);
        setLoadingCheck(false);
        return;
      }
      // Strip PII (emails, phone numbers) from seller free-text before sending to LLM
      const sanitisedDesc = (listing.description || "")
        .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[removed]")
        .replace(/(\+?61|0)[\s-]?[2-478](?:[\s-]?\d){8}/g, "[removed]");

      const prompt = `You are an expert Australian used car buyer advisor. Analyze this listing comprehensively:
- ${listing.car_year} ${listing.car_make} ${listing.car_model}
- Odometer: ${listing.odometer?.toLocaleString()} km
- Location: ${listing.suburb}, ${listing.state}
- Transmission: ${listing.transmission || "unknown"}
- Service history: ${listing.service_history || "unknown"}
- Condition stated: ${listing.condition || "unknown"}
${sanitisedDesc ? `- Description: ${sanitisedDesc}` : ""}

Provide comprehensive pre-purchase analysis including red flags, green flags, upcoming maintenance costs, inspection checklist, and overall recommendation. DO NOT focus on price - that's for the buyer to assess separately.`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            red_flags: { type: "array", items: { type: "string" } },
            green_flags: { type: "array", items: { type: "string" } },
            upcoming_costs: { type: "array", items: { type: "object", properties: { item: { type: "string" }, cost_range: { type: "string" }, urgency: { type: "string" } } } },
            inspection_checklist: { type: "array", items: { type: "string" } },
            overall_score: { type: "number" },
            recommendation: { type: "string", enum: ["buy", "negotiate", "avoid"] },
            summary: { type: "string" }
          }
        }
      });
      setUsedCarCheck(res);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load analysis");
    } finally {
      setLoadingCheck(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-card border-b border-border p-4 flex justify-between items-center">
          <h2 className="font-heading font-bold text-lg">{listing.car_year} {listing.car_make} {listing.car_model}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        {!usedCarCheck && !loadingCheck && (
          <div className="bg-accent/5 border-b border-accent/20 p-4">
            <button onClick={triggerUsedCarCheck} className="w-full h-10 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition-colors flex items-center justify-center gap-2">
              <Coins className="h-4 w-4" /> Get Buyer Analysis (5 credits)
            </button>
          </div>
        )}

        {loadingCheck && (
          <div className="p-6 flex items-center justify-center gap-2 text-accent">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Analyzing vehicle...</span>
          </div>
        )}

        <div className="p-6 space-y-6">
          {listing.photo_urls?.length > 0 && (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {listing.photo_urls.slice(0, 4).map((url, i) => (
                  <img key={i} src={url} alt="" className="h-32 w-full object-cover rounded-lg" />
                ))}
              </div>
              {listing.photo_urls.length > 4 && (
                <p className="text-xs text-muted-foreground text-center">+{listing.photo_urls.length - 4} more photos</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-muted-foreground">Odometer</p><p className="font-bold text-lg">{listing.odometer?.toLocaleString()} km</p></div>
            <div><p className="text-xs text-muted-foreground">Transmission</p><p className="font-bold text-lg">{listing.transmission || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Service History</p><p className="font-bold text-lg">{listing.service_history || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Condition</p><p className="font-bold text-lg capitalize">{listing.condition || "—"}</p></div>
          </div>

          {listing.market_price_average && (
            <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
              <p className="font-heading font-bold text-sm">Market Valuation</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-xs text-muted-foreground">Low</p><p className="font-bold text-lg">${listing.market_price_low?.toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Average</p><p className="font-bold text-lg text-accent">${listing.market_price_average?.toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">High</p><p className="font-bold text-lg">${listing.market_price_high?.toLocaleString()}</p></div>
              </div>
            </div>
          )}

          {listing.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Description</p>
              <p className="text-sm leading-relaxed">{listing.description}</p>
            </div>
          )}

          {usedCarCheck && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-heading font-bold text-sm">Buyer Analysis</p>
                  <span className={`text-lg font-bold ${usedCarCheck.overall_score >= 7 ? "text-emerald-600" : usedCarCheck.overall_score >= 5 ? "text-amber-600" : "text-red-600"}`}>
                    {usedCarCheck.overall_score}/10
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{usedCarCheck.summary}</p>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold inline-block ${usedCarCheck.recommendation === "buy" ? "bg-emerald-100 text-emerald-700" : usedCarCheck.recommendation === "negotiate" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                  {usedCarCheck.recommendation.charAt(0).toUpperCase() + usedCarCheck.recommendation.slice(1)}
                </span>
              </div>

              {usedCarCheck.red_flags?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-red-700 mb-2 uppercase tracking-wide">Red Flags</p>
                  <ul className="space-y-1">{usedCarCheck.red_flags.map((f, i) => <li key={i} className="text-xs text-red-700">• {f}</li>)}</ul>
                </div>
              )}

              {usedCarCheck.green_flags?.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-emerald-700 mb-2 uppercase tracking-wide">Green Flags</p>
                  <ul className="space-y-1">{usedCarCheck.green_flags.map((f, i) => <li key={i} className="text-xs text-emerald-700">✓ {f}</li>)}</ul>
                </div>
              )}

              {usedCarCheck.upcoming_costs?.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs font-bold mb-3">Upcoming Maintenance Costs</p>
                  <div className="space-y-2">
                    {usedCarCheck.upcoming_costs.map((c, i) => (
                      <div key={i} className="flex justify-between text-xs border-b border-border pb-2 last:border-0">
                        <div><p className="font-medium">{c.item}</p><p className="text-muted-foreground text-[10px]">{c.urgency}</p></div>
                        <p className="font-bold text-right">{c.cost_range}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {usedCarCheck.inspection_checklist?.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs font-bold mb-3">Inspection Checklist</p>
                  <ul className="space-y-1">
                    {usedCarCheck.inspection_checklist.map((item, i) => (
                      <li key={i} className="text-xs flex gap-2 items-start">
                        <input type="checkbox" className="w-3 h-3 mt-0.5 flex-shrink-0" readOnly />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                Disclaimer: This analysis is based on market data and should be used as a guide only. It does not constitute professional mechanical advice. Always get an independent pre-purchase inspection before buying a used vehicle.
              </p>
            </div>
          )}

          <div className="bg-secondary/20 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Seller</p>
            <p className="text-sm font-medium">{listing.seller_email}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Listed {listing.listed_date ? format(new Date(listing.listed_date), "dd MMM yyyy") : "—"}
            </p>
          </div>

          {listing.seller_email === user?.email ? (
            <p className="text-center text-sm text-muted-foreground py-2">This is your listing</p>
          ) : !showMessageInput ? (
            <Button onClick={() => setShowMessageInput(true)} className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-heading font-bold gap-2">
              <MessageSquare className="h-4 w-4" /> Contact Seller
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold">Send a message to the seller</p>
              <Input
                placeholder={`Hi, I'm interested in your ${listing.car_year} ${listing.car_make}...`}
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="h-11"
                onKeyDown={e => { if (e.key === "Enter" && message.trim()) handleContactSeller(); }}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleContactSeller}
                  disabled={!message.trim() || sendingMessage}
                  className="flex-1 h-10 bg-accent hover:bg-accent/90 text-white font-bold gap-2"
                >
                  {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send Message
                </Button>
                <Button variant="outline" onClick={() => setShowMessageInput(false)} className="h-10">Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}