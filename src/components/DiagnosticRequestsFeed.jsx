import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, MapPin, ChevronRight, Loader2, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function DiagnosticRequestsFeed({ profile }) {
  const [requests, setRequests] = useState([]);
  const [myOffers, setMyOffers] = useState({}); // keyed by request id
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [offerForm, setOfferForm] = useState({ fee: "", message: "" });
  const [submittingId, setSubmittingId] = useState(null);
  const [offeringId, setOfferingId] = useState(null); // which request is open for offer input

  useEffect(() => {
    loadRequests();
  }, [profile]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      // Fetch open diagnostic requests in mechanic's state (PII-free, via backend)
      const res = await base44.functions.invoke('getOpenDiagnosticRequests', { state: profile.state });
      const open = res.data?.requests || [];
      setRequests(open);

      // Fetch this mechanic's existing offers
      if (open.length > 0) {
        const allMyOffers = await base44.entities.DiagnosticOffer.filter(
          { mechanic_profile_id: profile.id },
          "-created_date",
          100
        );
        const offerMap = {};
        allMyOffers.forEach(o => { offerMap[o.diagnostic_request_id] = o; });
        setMyOffers(offerMap);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load diagnostic requests.");
    } finally {
      setLoading(false);
    }
  };

  const submitOffer = async (request) => {
    if (!offerForm.fee || isNaN(parseFloat(offerForm.fee))) {
      toast.error("Please enter a valid flat fee amount.");
      return;
    }
    setSubmittingId(request.id);
    try {
      const res = await base44.functions.invoke('submitDiagnosticOffer', {
        diagnostic_request_id: request.id,
        flat_fee: parseFloat(offerForm.fee),
        message: offerForm.message || "",
      });
      if (!res.data?.success) throw new Error(res.data?.error || "Offer failed");
      const offer = res.data.offer;

      setMyOffers(prev => ({ ...prev, [request.id]: offer }));
      setOfferingId(null);
      setOfferForm({ fee: "", message: "" });
      toast.success("Offer submitted! The user will see it on their requests page.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit offer.");
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-7 h-7 border-4 border-slate-200 border-t-[#f97316] rounded-full animate-spin" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <AlertTriangle className="h-9 w-9 mx-auto mb-3 opacity-30" />
        <p className="font-semibold text-slate-600">No open diagnostic requests in {profile.state} right now.</p>
        <p className="text-sm mt-1">Check back soon — new requests appear here instantly.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">
        {requests.length} open request{requests.length !== 1 ? "s" : ""} in {profile.state} — submit a flat fee offer to appear in the user's list.
      </p>

      {requests.map((r, i) => {
        const myOffer = myOffers[r.id];
        const isExpanded = expandedId === r.id;
        const isOfferingThis = offeringId === r.id;

        return (
          <div key={r.id} className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            {/* Header row */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : r.id)}
              className="w-full px-5 py-4 flex items-start justify-between gap-3 text-left hover:bg-slate-50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-heading font-bold text-base text-slate-900">{r.car_year} {r.car_make} {r.car_model}</p>
                  {myOffer ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Offer Sent — ${myOffer.flat_fee?.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">
                      New Request
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {r.suburb}, {r.state}
                  <span className="mx-1">·</span>
                  <Clock className="h-3 w-3" />
                  {r.created_date ? format(new Date(r.created_date), "dd MMM, h:mma") : ""}
                </p>
                <p className="text-sm text-slate-600 mt-1 line-clamp-1 italic">"{r.problem_description}"</p>
              </div>
              <ChevronRight className={`h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                {/* Car + problem details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-0.5">Vehicle</p>
                    <p className="text-sm font-bold text-slate-800">{r.car_year} {r.car_make} {r.car_model}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-0.5">Location</p>
                    <p className="text-sm font-bold text-slate-800">{r.suburb}, {r.state}</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-600 mb-1 uppercase tracking-widest">Customer's Problem</p>
                  <p className="text-sm text-slate-700">{r.problem_description}</p>
                </div>

                {/* Already offered */}
                {myOffer && !isOfferingThis && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-emerald-600 mb-1 uppercase tracking-widest">Your Offer</p>
                    <p className="text-lg font-black text-emerald-800">${myOffer.flat_fee?.toLocaleString()} flat fee</p>
                    {myOffer.message && <p className="text-xs text-emerald-600 mt-1">"{myOffer.message}"</p>}
                    <p className="text-xs text-slate-400 mt-2">Submitted {myOffer.created_date ? format(new Date(myOffer.created_date), "dd MMM, h:mma") : ""}</p>
                  </div>
                )}

                {/* Offer form */}
                {!myOffer && (
                  <>
                    {!isOfferingThis ? (
                      <Button onClick={() => setOfferingId(r.id)}
                        className="w-full h-11 bg-[#f97316] hover:bg-[#ea6c0a] text-white font-heading font-bold gap-2">
                        Submit a Flat Fee Offer
                      </Button>
                    ) : (
                      <div className="space-y-3 border-t border-slate-100 pt-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                          <strong>Your offer:</strong> Set a flat fee for visiting the customer. This can be a <em>diagnosis-only visit</em> (written report, no obligation to fix) or an offer to <em>diagnose + fix</em> — make it clear in your message.
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-400">Flat fee amount (AUD) *</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                            <Input
                              type="number"
                              placeholder="e.g. 120"
                              value={offerForm.fee}
                              onChange={e => setOfferForm(p => ({ ...p, fee: e.target.value }))}
                              className="h-12 pl-7 bg-slate-50 border-slate-200 font-medium"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-400">Message to customer — clarify if this is diagnosis only or diagnosis + fix *</Label>
                          <textarea
                            value={offerForm.message}
                            onChange={e => setOfferForm(p => ({ ...p, message: e.target.value }))}
                            placeholder="e.g. This covers a full diagnostic visit with a written report. If you want me to fix it on the same day, I can give you a separate quote on the spot."
                            rows={4}
                            className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => submitOffer(r)} disabled={submittingId === r.id || !offerForm.fee}
                            className="flex-1 h-11 bg-[#f97316] hover:bg-[#ea6c0a] text-white font-semibold gap-2">
                            {submittingId === r.id
                              ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                              : "Submit Offer"
                            }
                          </Button>
                          <Button variant="outline" onClick={() => { setOfferingId(null); setOfferForm({ fee: "", message: "" }); }}
                            className="h-11 px-4">Cancel</Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}