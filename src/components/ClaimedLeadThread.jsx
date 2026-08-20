import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Loader2, XCircle, Send, Wrench, MapPin, Gauge, Fuel, Settings2, AlertTriangle, PhoneCall } from "lucide-react";
import FairPricePanel from "./FairPricePanel";
import { toast } from "sonner";
import { format } from "date-fns";
import { fireMechanicMessageNotification, requestNotificationPermissionSilently } from "@/lib/notifications";

const isPlaceholderText = (msg) =>
  !msg || msg.toLowerCase().includes("claimed via live lead") || msg.trim() === "A";

export default function ClaimedLeadThread({ lead, profile }) {
  const [quoteRequest, setQuoteRequest] = useState(null);
  const [quoteCheck, setQuoteCheck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [offerReasoning, setOfferReasoning] = useState("");
  const [confirmDecline, setConfirmDecline] = useState(false);

  useEffect(() => {
    loadThread();
    requestNotificationPermissionSilently();
    const unsub = base44.entities.QuoteRequest.subscribe((event) => {
      if (event.type === "update" && event.data) {
        setQuoteRequest(prev => {
          if (!prev || prev.id !== event.id) return prev;
          if (event.data.user_reply && event.data.user_reply !== prev.user_reply) {
            fireMechanicMessageNotification({
              customerName: event.data.user_full_name || "Customer",
              preview: event.data.user_reply?.slice(0, 80),
              onClick: () => window.focus(),
            });
          }
          return { ...prev, ...event.data };
        });
      }
    });
    return unsub;
  }, [lead.id]);

  const loadThread = async () => {
    setLoading(true);
    try {
      let match = null;
      if (lead.quote_check_id) {
        const byQuoteId = await base44.entities.QuoteRequest.filter({ mechanic_profile_id: profile.id }, "-created_date", 100);
        match = byQuoteId.find(r => r.car_make === lead.car_make && r.car_model === lead.car_model && r.service_type === lead.service_type && r.user_email === lead.user_email);
        if (!match) match = byQuoteId[0] || null;
      } else {
        const requests = await base44.entities.QuoteRequest.filter({ mechanic_profile_id: profile.id }, "-created_date", 50);
        match = requests.find(r => r.car_make === lead.car_make && r.car_model === lead.car_model && r.user_email === lead.user_email) || requests[0] || null;
      }
      setQuoteRequest(match);

      if (lead.quote_check_id && lead.quote_check_id !== 'unknown') {
        try {
          const checks = await base44.entities.QuoteCheck.filter({ car_make: lead.car_make, car_model: lead.car_model, service_type: lead.service_type }, '-created_date', 20);
          const exact = checks.find(c => c.id === lead.quote_check_id);
          const byEmail = checks.find(c => c.created_by === lead.user_email);
          if (exact) setQuoteCheck(exact);
          else if (byEmail) setQuoteCheck(byEmail);
          else if (checks.length > 0) setQuoteCheck(checks[0]);
        } catch { }
      }
    } catch { } finally {
      setLoading(false);
    }
  };

  const buildConversation = (r) => {
    const conv = r.conversation ? [...r.conversation] : [];
    const hasUserReply = conv.some(m => m.role === "user" && m.message === r.user_reply);
    const hasMechanicFollowup = conv.some(m => m.role === "mechanic" && m.message === r.mechanic_followup);
    if (conv.length === 0) {
      if (r.notes) conv.push({ role: "user", message: r.notes, timestamp: r.created_date });
      if (r.mechanic_response) conv.push({ role: "mechanic", message: r.mechanic_response + (r.mechanic_quote ? ` — Quoted: $${r.mechanic_quote.toLocaleString()}` : ""), timestamp: null });
      if (r.user_reply) conv.push({ role: "user", message: r.user_reply, timestamp: null });
      if (r.mechanic_followup) conv.push({ role: "mechanic", message: r.mechanic_followup, timestamp: null });
    } else {
      if (r.user_reply && !hasUserReply) conv.push({ role: "user", message: r.user_reply, timestamp: null });
      if (r.mechanic_followup && !hasMechanicFollowup) conv.push({ role: "mechanic", message: r.mechanic_followup, timestamp: null });
    }
    // Filter out pure placeholder messages
    return conv.filter(m => !isPlaceholderText(m.message) || m.role === "mechanic");
  };

  const sendInitialResponse = async () => {
    if (!messageText.trim()) { toast.error("Please write a response first."); return; }
    setSending(true);
    try {
      const r = quoteRequest;
      const existing = buildConversation(r);
      const hasUserOpener = existing.some(m => m.role === "user");
      const thread = [
        ...existing,
        ...(!hasUserOpener && r.notes && !isPlaceholderText(r.notes) ? [{ role: "user", message: r.notes, timestamp: r.created_date }] : []),
        { role: "mechanic", message: messageText + (quoteAmount ? ` — Quoted: $${parseFloat(quoteAmount).toLocaleString()}` : ""), timestamp: new Date().toISOString() }
      ];
      const updated = { status: "responded", mechanic_response: messageText, mechanic_quote: quoteAmount ? parseFloat(quoteAmount) : undefined, conversation: thread };
      await base44.entities.QuoteRequest.update(r.id, updated);
      // Save the mechanic's offer price + reasoning back to the lead record
      if (quoteAmount || offerReasoning) {
        const fairLow = lead.app_fair_price_low;
        const fairHigh = lead.app_fair_price_high;
        const offerPrice = parseFloat(quoteAmount) || 0;
        const canMatch = fairLow && fairHigh && offerPrice >= fairLow * 0.9 && offerPrice <= fairHigh * 1.1;
        await base44.entities.MechanicLead.update(lead.id, {
          mechanic_offer_price: offerPrice || undefined,
          mechanic_offer_reasoning: offerReasoning || undefined,
          mechanic_can_match: canMatch,
        });
      }
      setQuoteRequest(prev => ({ ...prev, ...updated, conversation: thread }));
      setComposing(false); setMessageText(""); setQuoteAmount(""); setOfferReasoning("");
      toast.success("Response sent!");
    } catch { toast.error("Failed to send."); } finally { setSending(false); }
  };

  const sendFollowUp = async () => {
    if (!messageText.trim()) return;
    setSending(true);
    try {
      const r = quoteRequest;
      const existing = buildConversation(r);
      const thread = [...existing, { role: "mechanic", message: messageText, timestamp: new Date().toISOString() }];
      await base44.entities.QuoteRequest.update(r.id, { mechanic_followup: messageText, conversation: thread });
      setQuoteRequest(prev => ({ ...prev, mechanic_followup: messageText, conversation: thread }));
      setComposing(false); setMessageText("");
      toast.success("Message sent!");
    } catch { toast.error("Failed to send."); } finally { setSending(false); }
  };

  const declineRequest = async () => {
    await base44.entities.QuoteRequest.update(quoteRequest.id, { status: "declined" });
    setQuoteRequest(prev => ({ ...prev, status: "declined" }));
    setConfirmDecline(false);
    toast.success("Request declined.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading conversation...
      </div>
    );
  }

  const qc = quoteCheck || {};

  // ── Vehicle specs chip row ──────────────────────────────────
  const VehicleBlock = () => {
    const r2 = quoteRequest || {};
    const variant = lead.car_variant || r2.car_variant || qc.car_variant;
    const odometer = lead.odometer || r2.odometer || qc.odometer;
    const fuelType = lead.fuel_type || r2.fuel_type || qc.fuel_type;
    const transmission = lead.transmission_type || r2.transmission_type || qc.transmission_type;
    const suburb = lead.suburb || r2.suburb || qc.suburb;
    const state = lead.state || r2.state || qc.state;
    const serviceType = lead.service_type || r2.service_type || qc.service_type;
    const notes = lead.quote_notes || r2.notes || qc.quote_notes;
    const hasNotes = notes && !isPlaceholderText(notes);

    return (
      <div className="rounded-2xl overflow-hidden border border-slate-200 mt-4">
        {/* Header bar */}
        <div className="bg-gradient-to-r from-[#1a237e] to-[#283593] px-4 py-3 flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <Wrench className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="font-heading font-extrabold text-white text-sm leading-tight">
              {lead.car_year || qc.car_year} {lead.car_make || qc.car_make} {lead.car_model || qc.car_model}
              {variant && <span className="font-normal text-white/70"> · {variant}</span>}
            </p>
            {serviceType && <p className="text-white/60 text-[11px] font-medium">{serviceType}</p>}
          </div>
        </div>
        {/* Chips */}
        <div className="bg-slate-50 px-4 py-3 flex flex-wrap gap-2">
          {odometer && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 font-semibold shadow-sm">
              <Gauge className="h-3 w-3 text-slate-400" /> {odometer.toLocaleString()} km
            </span>
          )}
          {fuelType && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 font-semibold shadow-sm">
              <Fuel className="h-3 w-3 text-slate-400" /> {fuelType}
            </span>
          )}
          {transmission && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 font-semibold shadow-sm">
              <Settings2 className="h-3 w-3 text-slate-400" /> {transmission}
            </span>
          )}
          {(suburb || state) && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 font-semibold shadow-sm">
              <MapPin className="h-3 w-3 text-slate-400" /> {suburb ? `${suburb}, ` : ""}{state}
            </span>
          )}
        </div>
        {hasNotes && (
          <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100">
            <p className="text-xs text-slate-500 italic bg-white border border-slate-200 rounded-xl px-3 py-2.5">
              💬 "{notes}"
            </p>
          </div>
        )}
      </div>
    );
  };

  // Contact info block — shown after claim when user provided phone/email
  const ContactBlock = () => {
    const phone = lead.user_phone;
    const email = lead.user_email;
    const name = lead.user_full_name;
    if (!phone && !email) return null;
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {name && <p className="text-sm font-bold text-slate-800 truncate">{name}</p>}
          {email && <p className="text-xs text-slate-500 truncate">{email}</p>}
        </div>
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex-shrink-0"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            Call
          </a>
        )}
      </div>
    );
  };

  if (!quoteRequest) {
    return (
      <div className="space-y-3">
        <VehicleBlock />
        <ContactBlock />
        <FairPricePanel lead={lead} />
        <div className="rounded-2xl bg-slate-50 border border-dashed border-slate-300 p-5 text-center">
          <MessageSquare className="h-6 w-6 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-500">No messages yet</p>
          <p className="text-xs text-slate-400 mt-0.5">The customer may contact you via email above.</p>
        </div>
      </div>
    );
  }

  const r = quoteRequest;
  const thread = buildConversation(r);
  const lastRole = thread.length > 0 ? thread[thread.length - 1].role : null;

  const statusConfig = {
    pending:   { label: "Pending reply", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    responded: { label: "Responded", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    declined:  { label: "Declined", cls: "bg-red-100 text-red-600 border-red-200" },
  };
  const sc = statusConfig[r.status] || { label: r.status, cls: "bg-slate-100 text-slate-500 border-slate-200" };

  return (
    <div className="space-y-4">
      <VehicleBlock />
      <ContactBlock />

      {/* ── ServCheck Fair Price Panel ── */}
      <FairPricePanel lead={lead} />

      {/* ── Quoted price callout ── */}
      {r.original_quoted_price && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Their current quote</span>
          <span className="font-heading font-extrabold text-lg text-red-600">${r.original_quoted_price?.toLocaleString()}</span>
        </div>
      )}

      {/* ── Conversation section ── */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-white border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Messages</p>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span>
        </div>

        {/* New reply banner */}
        {lastRole === "user" && r.status === "responded" && (
          <div className="flex items-center gap-2 bg-blue-50 border-b border-blue-100 px-4 py-2.5">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
            <p className="text-xs font-bold text-blue-700">New reply from customer — tap to reply</p>
          </div>
        )}

        {/* Bubbles */}
        <div className="bg-slate-50 px-4 py-4 space-y-3 min-h-[60px]">
          {thread.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-2">No messages yet.</p>
          ) : (
            thread.map((msg, i) => {
              const isMechanic = msg.role === "mechanic";
              const placeholder = isPlaceholderText(msg.message);
              return (
                <div key={i} className={`flex ${isMechanic ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] space-y-1 ${isMechanic ? "items-end" : "items-start"} flex flex-col`}>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest px-1 text-slate-400">
                      {isMechanic ? "You" : "Customer"}
                    </p>
                    <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                      isMechanic
                        ? "bg-[#1a237e] text-white rounded-tr-sm"
                        : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                    }`}>
                      <p className={`text-sm leading-relaxed ${placeholder ? "italic opacity-60" : ""}`}>
                        {placeholder
                          ? (isMechanic ? "Responded to this enquiry" : "Enquired via ServCheck")
                          : msg.message}
                      </p>
                      {msg.timestamp && (
                        <p className={`text-[10px] mt-1.5 ${isMechanic ? "text-white/50" : "text-slate-400"}`}>
                          {format(new Date(msg.timestamp), "d MMM, h:mm a")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Actions ── */}

      {/* Pending: respond or decline */}
      {r.status === "pending" && !composing && !confirmDecline && (
        <div className="flex gap-3">
          <button
            onClick={() => setComposing(true)}
            className="flex-1 h-13 py-3.5 rounded-2xl bg-[#f97316] text-white font-heading font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#ea6c0a] active:scale-[0.98] transition-all shadow-md shadow-orange-200"
          >
            <Send className="h-4 w-4" /> Respond to Customer
          </button>
          <button
            onClick={() => setConfirmDecline(true)}
            className="h-13 py-3.5 px-4 rounded-2xl border-2 border-slate-200 text-slate-500 font-bold text-sm flex items-center gap-1.5 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Decline confirmation */}
      {confirmDecline && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="font-heading font-bold text-sm text-red-700">Decline this request?</p>
          </div>
          <p className="text-xs text-red-500 leading-relaxed">The customer will be notified. This can't be undone.</p>
          <div className="flex gap-2">
            <button onClick={declineRequest} className="flex-1 h-11 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors">
              Yes, Decline
            </button>
            <button onClick={() => setConfirmDecline(false)} className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors">
              Keep It
            </button>
          </div>
        </div>
      )}

      {/* Compose form */}
      {composing && (
        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-white border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              {r.status === "pending" ? "Your Response" : "New Message"}
            </p>
          </div>
          <div className="bg-slate-50 p-4 space-y-3">
            <textarea
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder={r.status === "pending" ? "Tell them your availability, experience, pricing..." : "Write your message..."}
              rows={4}
              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 font-medium shadow-sm"
            />
            {r.status === "pending" && (
              <div className="space-y-2.5">
                {/* Fair price reference */}
                {(lead.app_fair_price_low || lead.app_fair_price_high) && (
                  <div className="flex items-center gap-2 bg-[#1a237e]/5 border border-[#1a237e]/20 rounded-xl px-3 py-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#1a237e]">Fair range:</span>
                    <span className="text-xs font-bold text-emerald-700">${lead.app_fair_price_low?.toLocaleString()} – ${lead.app_fair_price_high?.toLocaleString()}</span>
                    {lead.app_fair_price_average && (
                      <span className="text-[10px] text-slate-500 ml-auto">avg ${lead.app_fair_price_average?.toLocaleString()}</span>
                    )}
                  </div>
                )}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                  <input
                    type="number"
                    placeholder="Your quote amount (optional)"
                    value={quoteAmount}
                    onChange={e => setQuoteAmount(e.target.value)}
                    className="w-full h-12 pl-9 pr-4 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 shadow-sm"
                  />
                </div>
                <textarea
                  value={offerReasoning}
                  onChange={e => setOfferReasoning(e.target.value)}
                  placeholder="Explain your price (e.g. 'Using OEM parts', 'My rate includes a full inspection'). Helps build trust with the customer."
                  rows={2}
                  className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 font-medium shadow-sm text-slate-600 placeholder:text-slate-400"
                />
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={r.status === "pending" ? sendInitialResponse : sendFollowUp}
                disabled={sending || !messageText.trim()}
                className="flex-1 h-12 rounded-xl bg-[#f97316] text-white text-sm font-heading font-bold flex items-center justify-center gap-2 hover:bg-[#ea6c0a] active:scale-[0.98] transition-all disabled:opacity-40 shadow-md shadow-orange-200"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Send</>}
              </button>
              <button
                onClick={() => { setComposing(false); setMessageText(""); setQuoteAmount(""); }}
                className="h-12 px-5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responded — follow-up */}
      {r.status === "responded" && !composing && (
        <button
          onClick={() => { setComposing(true); setMessageText(""); }}
          className={`w-full py-3.5 rounded-2xl text-sm font-heading font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
            lastRole === "user"
              ? "bg-[#1a237e] text-white hover:bg-[#1e2d8f] shadow-md shadow-blue-200"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          {lastRole === "user" ? "Reply to Customer" : "Send Follow-up"}
        </button>
      )}

      {r.status === "declined" && (
        <div className="flex items-center justify-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3.5">
          <XCircle className="h-4 w-4 text-red-400" />
          <p className="text-sm font-bold text-red-500">You declined this request</p>
        </div>
      )}
    </div>
  );
}