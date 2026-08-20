import { useState, useEffect } from "react";
import SEOHead from "../components/SEOHead";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Car, AlertTriangle, CheckCircle2, Phone, ChevronRight, Loader2, Star, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function MyDiagnosticRequests() {
  const [requests, setRequests] = useState([]);
  const [offers, setOffers] = useState({}); // keyed by request id
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      if (!user) return;

      const reqs = await base44.entities.DiagnosticRequest.filter(
        { user_email: user.email },
        "-created_date",
        50
      );
      setRequests(reqs);

      // Load offers for all requests
      const offerMap = {};
      await Promise.all(reqs.map(async (r) => {
        const reqOffers = await base44.entities.DiagnosticOffer.filter(
          { diagnostic_request_id: r.id },
          "flat_fee",
          50
        );
        offerMap[r.id] = reqOffers;
      }));
      setOffers(offerMap);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load your requests.");
    } finally {
      setLoading(false);
    }
  };

  const acceptOffer = async (request, offer) => {
    setAcceptingId(offer.id);
    try {
      // Mark this offer as accepted, others as declined
      const reqOffers = offers[request.id] || [];
      await Promise.all(reqOffers.map(o =>
        base44.entities.DiagnosticOffer.update(o.id, {
          status: o.id === offer.id ? "accepted" : "declined"
        })
      ));

      // Update the request status
      await base44.entities.DiagnosticRequest.update(request.id, {
        status: "accepted",
        accepted_mechanic_id: offer.mechanic_profile_id,
        accepted_mechanic_name: offer.mechanic_business_name,
      });

      // Update local state
      setRequests(prev => prev.map(r => r.id === request.id ? {
        ...r,
        status: "accepted",
        accepted_mechanic_id: offer.mechanic_profile_id,
        accepted_mechanic_name: offer.mechanic_business_name,
      } : r));
      setOffers(prev => ({
        ...prev,
        [request.id]: (prev[request.id] || []).map(o => ({
          ...o,
          status: o.id === offer.id ? "accepted" : "declined"
        }))
      }));

      toast.success(`You've chosen ${offer.mechanic_business_name}! Contact them to book in.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to accept offer. Please try again.");
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#f97316] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <SEOHead title="My Diagnostic Requests" description="Your diagnostic requests." path="/my-diagnostic-requests" noindex={true} />
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">My Requests</p>
        <h1 className="font-heading font-black text-3xl text-[#1a237e] mb-1.5 leading-tight">Diagnostic Requests</h1>
        <p className="text-slate-500 text-sm">Review mechanic offers and choose who to go with.</p>
      </motion.div>

      {requests.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-600">No diagnostic requests yet.</p>
          <p className="text-sm mt-1">Go to <strong>Find a Mechanic</strong> and describe your car problem to get started.</p>
        </div>
      )}

      <div className="space-y-5">
        {requests.map((r, i) => {
          const reqOffers = offers[r.id] || [];
          const pendingOffers = reqOffers.filter(o => o.status === "pending");
          const acceptedOffer = reqOffers.find(o => o.status === "accepted");
          const isExpanded = expandedId === r.id;
          const cheapestOffer = [...reqOffers].sort((a, b) => a.flat_fee - b.flat_fee)[0];

          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">

              {/* Card Header */}
              <button onClick={() => setExpandedId(isExpanded ? null : r.id)}
                className="w-full px-5 py-4 flex items-start justify-between gap-3 text-left hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-heading font-bold text-base text-slate-900">{r.car_year} {r.car_make} {r.car_model}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      r.status === "accepted" ? "bg-emerald-100 text-emerald-700" :
                      r.status === "closed" ? "bg-slate-100 text-slate-500" :
                      "bg-orange-100 text-orange-700"
                    }`}>
                      {r.status === "open" ? "Open" : r.status === "accepted" ? "Accepted" : "Closed"}
                    </span>
                    {reqOffers.length > 0 && r.status === "open" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                        {reqOffers.length} offer{reqOffers.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {r.suburb}, {r.state}
                    <span className="mx-1">·</span>
                    <Clock className="h-3 w-3" />
                    {r.created_date ? format(new Date(r.created_date), "dd MMM yyyy") : ""}
                  </p>
                  <p className="text-sm text-slate-600 mt-1.5 line-clamp-1 italic">"{r.problem_description}"</p>
                </div>
                <ChevronRight className={`h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
              </button>

              {/* Expanded */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                  {/* Full description */}
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Your Problem</p>
                    <p className="text-sm text-slate-700">{r.problem_description}</p>
                  </div>

                  {/* Accepted result */}
                  {r.status === "accepted" && acceptedOffer && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <p className="font-heading font-bold text-emerald-800">You chose {acceptedOffer.mechanic_business_name}</p>
                      </div>
                      <p className="text-sm text-emerald-700">Flat fee: <strong className="text-lg">${acceptedOffer.flat_fee?.toLocaleString()}</strong></p>
                      {acceptedOffer.message && <p className="text-xs text-emerald-600 mt-1">"{acceptedOffer.message}"</p>}
                      {acceptedOffer.mechanic_phone && (
                        <a href={`tel:${acceptedOffer.mechanic_phone}`} className="mt-3 inline-block">
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9">
                            <Phone className="h-3.5 w-3.5" /> Call {acceptedOffer.mechanic_business_name}
                          </Button>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Offers list */}
                  {r.status === "open" && (
                    <>
                      {reqOffers.length === 0 ? (
                        <div className="text-center py-6 text-slate-400">
                          <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin opacity-40" />
                          <p className="text-sm">Waiting for mechanics to respond...</p>
                          <p className="text-xs mt-1">You'll see their flat fee offers here as they come in.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            {reqOffers.length} mechanic offer{reqOffers.length !== 1 ? "s" : ""} — sorted by price
                          </p>
                          {[...reqOffers].sort((a, b) => a.flat_fee - b.flat_fee).map((offer, oi) => (
                            <div key={offer.id}
                              className={`rounded-xl border p-4 ${oi === 0 ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-heading font-bold text-sm text-slate-900">{offer.mechanic_business_name}</p>
                                    {oi === 0 && (
                                      <span className="text-[11px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                        <Star className="h-2.5 w-2.5" /> Best Price
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                    <MapPin className="h-3 w-3" />
                                    {offer.mechanic_suburb} · {offer.mechanic_type === "mobile_mechanic" ? "Mobile Mechanic" : "Workshop"}
                                  </p>
                                  {offer.message && (
                                    <p className="text-xs text-slate-600 mt-1.5 italic">"{offer.message}"</p>
                                  )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="font-heading font-black text-xl text-[#1a237e]">${offer.flat_fee?.toLocaleString()}</p>
                                  <p className="text-[10px] text-slate-400">flat fee</p>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-3">
                                {offer.mechanic_phone && (
                                  <a href={`tel:${offer.mechanic_phone}`} className="flex-1">
                                    <Button variant="outline" size="sm" className="w-full gap-1.5 h-9 text-xs">
                                      <Phone className="h-3.5 w-3.5" /> Call
                                    </Button>
                                  </a>
                                )}
                                <Button size="sm"
                                  onClick={() => acceptOffer(r, offer)}
                                  disabled={acceptingId === offer.id}
                                  className="flex-1 h-9 text-xs bg-[#f97316] hover:bg-[#ea6c0a] text-white font-semibold gap-1.5">
                                  {acceptingId === offer.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle2 className="h-3.5 w-3.5" /> Choose This Mechanic</>}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}