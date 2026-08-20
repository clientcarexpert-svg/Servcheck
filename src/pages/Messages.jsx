import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import SEOHead from "../components/SEOHead";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Loader2, ChevronLeft, Car, Wrench, Clock, CheckCircle2, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { fireMessageNotification, requestNotificationPermissionSilently } from "@/lib/notifications";

// A unified inbox merging QuoteRequests + DiagnosticOffers into one thread list
export default function Messages() {
  const [user, setUser] = useState(null);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadAll();
    // Request push notification permission so we can notify on new messages
    requestNotificationPermissionSilently();
  }, []);

  useEffect(() => {
    if (activeThread) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread]);

  // Real-time: keep open thread + list in sync when mechanic sends a message.
  // (Push notifications are fired globally from Layout via useUnreadMessages.)
  useEffect(() => {
    const unsub = base44.entities.QuoteRequest.subscribe((event) => {
      if (event.type === "update" && event.data) {
        const newData = event.data;
        // Update in thread list
        setThreads(prev => prev.map(t =>
          t.id === `qr-${event.id}`
            ? { ...t, data: { ...t.data, ...newData }, preview: newData.mechanic_followup ? `Mechanic: ${newData.mechanic_followup.slice(0, 60)}` : newData.mechanic_response ? `Mechanic: ${newData.mechanic_response.slice(0, 60)}` : t.preview, hasUnread: true }
            : t
        ));
        // Update active thread if open
        setActiveThread(prev => {
          if (!prev || prev.id !== `qr-${event.id}`) return prev;
          return { ...prev, data: { ...prev.data, ...newData } };
        });
      }
    });
    return unsub;
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const u = await base44.auth.me();
      setUser(u);

      // Load both types in parallel (as buyer AND as seller/mechanic)
      const [quoteReqs, quoteReqsAsSeller, diagRequests] = await Promise.all([
        base44.entities.QuoteRequest.filter({ user_email: u.email }, "-updated_date", 100),
        base44.entities.QuoteRequest.filter({ mechanic_email: u.email }, "-updated_date", 100),
        base44.entities.DiagnosticRequest.filter({ user_email: u.email }, "-updated_date", 50),
      ]);

      // Load diagnostic offers for all diag requests
      const diagOffers = diagRequests.length > 0
        ? await Promise.all(diagRequests.map(r =>
            base44.entities.DiagnosticOffer.filter({ diagnostic_request_id: r.id }, "-created_date", 50)
          ))
        : [];

      // Build thread list
      const allThreads = [];

      // QuoteRequest threads — one per mechanic conversation (skip hidden)
      const seenQrIds = new Set();
      quoteReqs.filter(qr => !qr.hidden_by_user).forEach(qr => {
        seenQrIds.add(qr.id);
        allThreads.push({
          id: `qr-${qr.id}`,
          type: "quote_request",
          role: "buyer",
          data: qr,
          lastTime: qr.updated_date || qr.created_date,
          mechanicName: qr.mechanic_business_name || "Mechanic",
          preview: qr.mechanic_response
            ? `Mechanic: ${qr.mechanic_response.slice(0, 60)}...`
            : qr.notes
            ? `You: ${qr.notes.slice(0, 60)}...`
            : `${qr.service_type} — awaiting reply`,
          hasUnread: !!qr.mechanic_response && (!qr.user_reply || (qr.conversation && qr.conversation[qr.conversation.length - 1]?.role === "mechanic")),
          vehicle: `${qr.car_year || ""} ${qr.car_make || ""} ${qr.car_model || ""}`.trim(),
          status: qr.status,
        });
      });

      // Threads where current user is the seller/mechanic (marketplace inquiries etc.)
      quoteReqsAsSeller.filter(qr => !seenQrIds.has(qr.id)).forEach(qr => {
        seenQrIds.add(qr.id);
        allThreads.push({
          id: `qr-${qr.id}`,
          type: "quote_request",
          role: "seller",
          data: qr,
          lastTime: qr.updated_date || qr.created_date,
          mechanicName: qr.user_email || "Buyer",
          preview: qr.conversation?.length > 0
            ? `${qr.conversation[qr.conversation.length - 1].role === "user" ? "Buyer" : "You"}: ${qr.conversation[qr.conversation.length - 1].message.slice(0, 60)}`
            : qr.notes
            ? `Buyer: ${qr.notes.slice(0, 60)}...`
            : `${qr.service_type} — new inquiry`,
          hasUnread: qr.conversation ? qr.conversation[qr.conversation.length - 1]?.role === "user" : !!qr.notes && !qr.mechanic_response,
          vehicle: `${qr.car_year || ""} ${qr.car_make || ""} ${qr.car_model || ""}`.trim(),
          status: qr.status,
        });
      });

      // DiagnosticOffer threads — one per offer (mechanic → user)
      diagRequests.forEach((dr, i) => {
        const offers = diagOffers[i] || [];
        offers.forEach(offer => {
          allThreads.push({
            id: `do-${offer.id}`,
            type: "diagnostic_offer",
            data: { request: dr, offer },
            lastTime: offer.updated_date || offer.created_date,
            mechanicName: offer.mechanic_business_name || "Mobile Mechanic",
            preview: offer.message
              ? `Offer: $${offer.flat_fee} — ${offer.message.slice(0, 50)}...`
              : `Flat fee offer: $${offer.flat_fee}`,
            hasUnread: offer.status === "pending",
            vehicle: `${dr.car_year || ""} ${dr.car_make || ""} ${dr.car_model || ""}`.trim(),
            status: offer.status,
          });
        });
      });

      // Sort by most recent
      allThreads.sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
      setThreads(allThreads);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  // Build canonical conversation — merges conversation array with any legacy fields not yet in it
  const buildConversation = (qr) => {
    const conv = qr.conversation ? [...qr.conversation] : [];
    // Check what's already covered
    const hasUserReply = conv.some(m => m.role === "user" && m.message === qr.user_reply);
    const hasMechanicFollowup = conv.some(m => m.role === "mechanic" && m.message === qr.mechanic_followup);
    const hasMechanicResponse = conv.some(m => m.role === "mechanic");
    const hasAnyUser = conv.some(m => m.role === "user");

    if (conv.length === 0) {
      // Fully legacy — build from scratch
      if (qr.notes) conv.push({ role: "user", message: qr.notes, timestamp: qr.created_date });
      if (qr.mechanic_response) conv.push({ role: "mechanic", message: qr.mechanic_response + (qr.mechanic_quote ? ` — Quoted: $${qr.mechanic_quote.toLocaleString()}` : ""), timestamp: null });
      if (qr.user_reply) conv.push({ role: "user", message: qr.user_reply, timestamp: null });
      if (qr.mechanic_followup) conv.push({ role: "mechanic", message: qr.mechanic_followup, timestamp: null });
    } else {
      // Conversation exists — append any legacy fields missing from it
      if (qr.user_reply && !hasUserReply) conv.push({ role: "user", message: qr.user_reply, timestamp: null });
      if (qr.mechanic_followup && !hasMechanicFollowup) conv.push({ role: "mechanic", message: qr.mechanic_followup, timestamp: null });
    }
    return conv;
  };

  const sendReply = async () => {
    if (!replyText.trim() || !activeThread) return;
    setSending(true);
    try {
      if (activeThread.type === "quote_request") {
        const qr = activeThread.data;
        const isSeller = activeThread.role === "seller";
        const msgRole = isSeller ? "mechanic" : "user";
        // Always bootstrap from full history so no messages are lost
        const existingThread = buildConversation(qr);
        const newMsg = { role: msgRole, message: replyText, timestamp: new Date().toISOString() };
        const updatedConversation = [...existingThread, newMsg];
        const updateData = { conversation: updatedConversation };
        if (isSeller) {
          updateData.mechanic_response = replyText;
        } else {
          updateData.user_reply = replyText;
        }
        await base44.entities.QuoteRequest.update(qr.id, updateData);
        const updatedData = { ...qr, user_reply: replyText, conversation: updatedConversation };
        setThreads(prev => prev.map(t =>
          t.id === activeThread.id
            ? { ...t, data: updatedData, hasUnread: false, preview: `You: ${replyText.slice(0, 60)}` }
            : t
        ));
        setActiveThread(t => ({ ...t, data: updatedData }));
      }
      setReplyText("");
      toast.success("Reply sent!");
    } catch {
      toast.error("Failed to send.");
    } finally {
      setSending(false);
    }
  };

  const hideThread = async (thread, e) => {
    e.stopPropagation();
    if (thread.type === "quote_request") {
      await base44.entities.QuoteRequest.update(thread.data.id, { hidden_by_user: true });
    }
    setThreads(prev => prev.filter(t => t.id !== thread.id));
    toast.success("Conversation removed.");
  };

  const acceptOffer = async (thread) => {
    const { request, offer } = thread.data;
    setSending(true);
    try {
      // Get all offers for this request and decline others
      const allOffers = await base44.entities.DiagnosticOffer.filter({ diagnostic_request_id: request.id }, null, 50);
      await Promise.all(allOffers.map(o =>
        base44.entities.DiagnosticOffer.update(o.id, { status: o.id === offer.id ? "accepted" : "declined" })
      ));
      await base44.entities.DiagnosticRequest.update(request.id, {
        status: "accepted",
        accepted_mechanic_id: offer.mechanic_profile_id,
        accepted_mechanic_name: offer.mechanic_business_name,
      });
      setThreads(prev => prev.map(t =>
        t.id === thread.id
          ? { ...t, data: { ...t.data, offer: { ...t.data.offer, status: "accepted" } }, status: "accepted", hasUnread: false }
          : t
      ));
      setActiveThread(t => ({ ...t, data: { ...t.data, offer: { ...t.data.offer, status: "accepted" } }, status: "accepted" }));
      toast.success(`You've chosen ${offer.mechanic_business_name}!`);
    } catch {
      toast.error("Failed to accept.");
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#f97316] rounded-full animate-spin" />
    </div>
  );

  // Thread detail view
  if (activeThread) {
    const isQuote = activeThread.type === "quote_request";
    const isDiag = activeThread.type === "diagnostic_offer";
    const qr = isQuote ? activeThread.data : null;
    const { request: dr, offer } = isDiag ? activeThread.data : { request: null, offer: null };

    return createPortal(
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, height: "100dvh", zIndex: 9999, display: "flex", flexDirection: "column", backgroundColor: "white" }}>
        {/* Thread header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white">
          <button onClick={() => setActiveThread(null)} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-slate-900 text-sm truncate">{activeThread.mechanicName}</p>
            <p className="text-xs text-slate-600 font-medium truncate">{activeThread.vehicle}</p>
          </div>
          {/* Phone call if available */}
          {isDiag && offer?.mechanic_phone && (
            <a href={`tel:${offer.mechanic_phone}`}>
              <button className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center hover:bg-emerald-200 transition-colors">
                <Phone className="h-4 w-4 text-emerald-700" />
              </button>
            </a>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50" style={{ overscrollBehavior: "contain", minHeight: 0 }}>
          {/* Context bubble */}
          <div className="flex justify-center">
            <span className="text-[11px] text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
              {isQuote ? `Quote request · ${qr.service_type}` : `Mobile diagnostic request · ${dr?.suburb}, ${dr?.state}`}
            </span>
          </div>

          {isQuote && (
            <>
              {/* Build full conversation — always bootstrapped from legacy fields if needed */}
              {(() => {
                const thread = buildConversation(qr);

                const isSeller = activeThread.role === "seller";
                return thread.map((msg, i) => {
                  const isMe = isSeller ? msg.role === "mechanic" : msg.role === "user";
                  return (
                  <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      isMe
                        ? "bg-[#1a237e] text-white rounded-tr-sm"
                        : "bg-white border border-slate-200 shadow-sm rounded-tl-sm"
                    }`}>
                      {!isMe && (
                        <p className="text-[11px] font-bold text-[#1a237e] mb-1">{isSeller ? (qr.user_email || "Buyer") : qr.mechanic_business_name}</p>
                      )}
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                      {msg.quote && (
                        <p className="text-sm font-bold text-emerald-700 mt-1.5">Their quote: ${msg.quote?.toLocaleString()}</p>
                      )}
                      {msg.originalQuote && (
                        <p className="text-xs text-blue-200 mt-1">Original quote: ${msg.originalQuote?.toLocaleString()}</p>
                      )}
                      {msg.timestamp && (
                        <p className={`text-[10px] mt-1 ${isMe ? "text-blue-200" : "text-slate-500"}`}>
                          {format(new Date(msg.timestamp), "dd MMM, h:mm a")}
                        </p>
                      )}
                    </div>
                  </div>
                  );
                });
              })()}

              {qr.status === "declined" && (
                <div className="flex justify-center">
                  <span className="text-[11px] text-red-400 bg-red-50 px-3 py-1 rounded-full border border-red-100">Mechanic declined this request</span>
                </div>
              )}

              {!qr.mechanic_response && qr.status !== "declined" && activeThread.role !== "seller" && (
                <div className="flex justify-center">
                  <span className="text-[11px] text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 animate-pulse">Waiting for reply...</span>
                </div>
              )}
            </>
          )}

          {isDiag && (
            <>
              {/* Problem description */}
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-[#1a237e] text-white rounded-2xl rounded-tr-sm px-4 py-2.5">
                  <p className="text-[11px] text-blue-200 mb-1">Your problem description</p>
                  <p className="text-sm leading-relaxed">{dr?.problem_description}</p>
                  <p className="text-[11px] text-blue-200 mt-1">{dr?.suburb}, {dr?.state}</p>
                </div>
              </div>

              {/* Mechanic's flat fee offer */}
              <div className="flex justify-start">
                <div className="max-w-[80%] bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-200 shadow-sm space-y-2">
                  <p className="text-[11px] font-bold text-slate-400">{offer?.mechanic_business_name} · {offer?.mechanic_type === "mobile_mechanic" ? "Mobile Mechanic" : "Workshop"}</p>
                  <div className="flex items-baseline gap-1">
                    <p className="font-heading font-black text-2xl text-[#1a237e]">${offer?.flat_fee?.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">flat fee</p>
                  </div>
                  {offer?.message && <p className="text-sm text-slate-700 leading-relaxed">{offer.message}</p>}

                  {/* Accept / decline actions */}
                  {offer?.status === "pending" && (
                    <div className="flex gap-2 pt-1">
                      <Button onClick={() => acceptOffer(activeThread)} disabled={sending}
                        className="flex-1 h-9 text-xs bg-[#f97316] hover:bg-[#ea6c0a] text-white font-bold gap-1">
                        {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle2 className="h-3.5 w-3.5" /> Accept</>}
                      </Button>
                      {offer?.mechanic_phone && (
                        <a href={`tel:${offer.mechanic_phone}`} className="flex-1">
                          <Button variant="outline" className="w-full h-9 text-xs gap-1">
                            <Phone className="h-3.5 w-3.5" /> Call
                          </Button>
                        </a>
                      )}
                    </div>
                  )}
                  {offer?.status === "accepted" && (
                    <div className="flex items-center gap-2 pt-1 text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <p className="text-xs font-bold">You accepted this offer</p>
                    </div>
                  )}
                  {offer?.status === "declined" && (
                    <p className="text-xs text-slate-400 pt-1">Offer declined</p>
                  )}
                </div>
              </div>
            </>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Reply input — always show for quote threads */}
        {isQuote && (
          <div className="flex-shrink-0 bg-white border-t border-slate-100 px-4 py-3 flex items-center gap-2" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
            <input
              type="text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
              placeholder={activeThread.role === "seller" ? "Reply to buyer..." : "Reply to mechanic..."}
              className="flex-1 h-11 rounded-xl bg-slate-50 border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
            <Button onClick={sendReply} disabled={!replyText.trim() || sending}
              className="h-10 w-10 rounded-full bg-[#f97316] hover:bg-[#ea6c0a] text-white p-0 flex items-center justify-center flex-shrink-0 disabled:opacity-40">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>,
      document.body
    );
  }

  // Inbox list view
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <SEOHead title="My Messages" description="Your mechanic conversations." path="/my-requests" noindex={true} />
      <div className="mb-6">
        <h1 className="font-heading font-black text-2xl text-[#1a237e]">Messages</h1>
        <p className="text-sm text-slate-600 mt-0.5 font-medium">All your conversations</p>
      </div>

      {threads.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="font-semibold text-slate-600">No messages yet</p>
          <p className="text-xs mt-1">When mechanics reply to you, it'll show up here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((thread, i) => (
            <motion.button
              key={thread.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => { setActiveThread(thread); setReplyText(""); }}
              className={`w-full flex items-start gap-3 px-4 py-4 rounded-2xl bg-white border-2 transition-all text-left ${
                thread.hasUnread
                  ? "border-[#f97316]/40 shadow-sm"
                  : "border-slate-200 hover:border-[#1a237e]/30 hover:shadow-sm"
              }`}
            >
              {/* Avatar — business initials */}
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-heading font-bold text-base ${
                thread.type === "diagnostic_offer"
                  ? "bg-gradient-to-br from-[#f97316] to-[#c2410c]"
                  : "bg-gradient-to-br from-[#1a237e] to-[#1565c0]"
              }`}>
                {(thread.mechanicName || "M").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className={`text-sm truncate ${thread.hasUnread ? "font-extrabold text-slate-900" : "font-bold text-slate-800"}`}>
                    {thread.mechanicName}
                  </p>
                  <span className={`text-[11px] flex-shrink-0 font-semibold ${thread.hasUnread ? "text-[#f97316]" : "text-slate-500"}`}>
                    {thread.lastTime ? formatDistanceToNow(new Date(thread.lastTime), { addSuffix: true }) : ""}
                  </span>
                </div>
                {thread.vehicle && (
                  <p className="text-xs text-slate-600 font-medium mb-1 flex items-center gap-1">
                    <Car className="h-3 w-3 text-slate-400 flex-shrink-0" /> {thread.vehicle}
                  </p>
                )}
                <p className={`text-xs truncate ${thread.hasUnread ? "text-slate-900 font-semibold" : "text-slate-600"}`}>
                  {thread.preview}
                </p>
              </div>

              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                {thread.hasUnread && (
                  <span className="text-[10px] font-bold text-white bg-[#f97316] px-2 py-0.5 rounded-full">New</span>
                )}
                {thread.type === "quote_request" && (
                  <button
                    onClick={(e) => hideThread(thread, e)}
                    className="h-7 w-7 rounded-full flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                    title="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}