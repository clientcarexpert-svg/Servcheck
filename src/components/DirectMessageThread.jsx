import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, Car, Wrench, MapPin, ChevronLeft, MessageSquare, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import BookingSlotPicker from "./BookingSlotPicker";

export default function DirectMessageThread({ quoteRequestId, profile, onBack }) {
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    loadRequest();
    const unsub = base44.entities.QuoteRequest.subscribe((event) => {
      if (event.type === "update" && event.id === quoteRequestId && event.data) {
        setQr(prev => prev ? { ...prev, ...event.data } : prev);
      }
    });
    return unsub;
  }, [quoteRequestId]);

  const loadRequest = async () => {
    setLoading(true);
    try {
      // Try direct ID lookup first via filter
      const all = await base44.entities.QuoteRequest.filter({ mechanic_profile_id: profile.id }, "-created_date", 200);
      const match = all.find(r => r.id === quoteRequestId);
      setQr(match || null);
    } catch {
      toast.error("Failed to load conversation.");
    } finally {
      setLoading(false);
    }
  };

  const buildConversation = (r) => {
    const conv = r.conversation ? [...r.conversation] : [];
    if (conv.length === 0) {
      if (r.notes) conv.push({ role: "user", message: r.notes, timestamp: r.created_date });
      if (r.mechanic_response) conv.push({ role: "mechanic", message: r.mechanic_response + (r.mechanic_quote ? ` — Quoted: $${r.mechanic_quote.toLocaleString()}` : ""), timestamp: null });
      if (r.user_reply) conv.push({ role: "user", message: r.user_reply, timestamp: null });
      if (r.mechanic_followup) conv.push({ role: "mechanic", message: r.mechanic_followup, timestamp: null });
    } else {
      const hasUserReply = conv.some(m => m.role === "user" && m.message === r.user_reply);
      const hasMechanicFollowup = conv.some(m => m.role === "mechanic" && m.message === r.mechanic_followup);
      if (r.user_reply && !hasUserReply) conv.push({ role: "user", message: r.user_reply, timestamp: null });
      if (r.mechanic_followup && !hasMechanicFollowup) conv.push({ role: "mechanic", message: r.mechanic_followup, timestamp: null });
    }
    return conv;
  };

  const handleSend = async () => {
    if (!messageText.trim()) return;
    setSending(true);
    try {
      const existing = buildConversation(qr);
      const newMsg = { role: "mechanic", message: messageText + (quoteAmount ? ` — Quoted: $${parseFloat(quoteAmount).toLocaleString()}` : ""), timestamp: new Date().toISOString() };
      const thread = [...existing, newMsg];

      const isFirstResponse = qr.status === "pending";
      const updateData = {
        conversation: thread,
        ...(isFirstResponse
          ? { status: "responded", mechanic_response: messageText, mechanic_quote: quoteAmount ? parseFloat(quoteAmount) : undefined }
          : { mechanic_followup: messageText }
        ),
      };

      await base44.entities.QuoteRequest.update(qr.id, updateData);
      setQr(prev => ({ ...prev, ...updateData, conversation: thread }));
      setMessageText("");
      setQuoteAmount("");
      toast.success("Message sent!");
    } catch {
      toast.error("Failed to send.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!qr) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Message not found</p>
        <button onClick={onBack} className="text-xs text-accent mt-2 hover:underline">← Back</button>
      </div>
    );
  }

  const thread = buildConversation(qr);

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" /> Back to Notifications
      </button>

      {/* Vehicle info header */}
      <div className="rounded-2xl overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-[#1a237e] to-[#283593] px-4 py-3 flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <Wrench className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="font-heading font-extrabold text-white text-sm leading-tight">
              {qr.car_year} {qr.car_make} {qr.car_model}
            </p>
            <p className="text-white/60 text-[11px] font-medium">{qr.service_type}</p>
          </div>
        </div>
        <div className="bg-slate-50 px-4 py-2.5 flex items-center gap-3 text-xs text-slate-600">
          {qr.suburb && <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-400" />{qr.suburb}, {qr.state}</span>}
          {qr.user_email && <span className="text-slate-400">{qr.user_email}</span>}
        </div>
      </div>

      {/* Conversation bubbles */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 bg-white border-b border-slate-100 px-4 py-3">
          <MessageSquare className="h-4 w-4 text-slate-400" />
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Messages</p>
          <span className={`ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full border ${
            qr.status === "pending" ? "bg-amber-100 text-amber-700 border-amber-200" :
            qr.status === "responded" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
            "bg-red-100 text-red-600 border-red-200"
          }`}>
            {qr.status === "pending" ? "Awaiting your reply" : qr.status === "responded" ? "Responded" : "Declined"}
          </span>
        </div>

        <div className="bg-slate-50 px-4 py-4 space-y-3 min-h-[80px]">
          {thread.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-2">No messages yet.</p>
          ) : (
            thread.map((msg, i) => {
              const isMechanic = msg.role === "mechanic";
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
                      <p className="text-sm leading-relaxed">{msg.message}</p>
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

      {/* Reply composer */}
      {qr.status !== "declined" && (
        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              {qr.status === "pending" ? "Your Response" : "Send Follow-up"}
            </p>
            <button
              onClick={() => setShowCalendar(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                showCalendar
                  ? "bg-[#1a237e] text-white border-[#1a237e]"
                  : "text-[#1a237e] border-[#1a237e]/30 hover:bg-[#1a237e]/5"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Book Slot
            </button>
          </div>
          <div className="bg-slate-50 p-4 space-y-3">
            {showCalendar && (
              <BookingSlotPicker
                profile={profile}
                quoteRequest={qr}
                onInsert={(slotText) => {
                  setMessageText(prev => prev ? prev + "\n" + slotText : slotText);
                  setShowCalendar(false);
                }}
                onClose={() => setShowCalendar(false)}
              />
            )}
            <textarea
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder={qr.status === "pending" ? "Tell them your availability, pricing, experience..." : "Write your message..."}
              rows={4}
              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 font-medium shadow-sm"
            />
            {qr.status === "pending" && (
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
            )}
            <button
              onClick={handleSend}
              disabled={sending || !messageText.trim()}
              className="w-full h-12 rounded-xl bg-[#f97316] text-white text-sm font-heading font-bold flex items-center justify-center gap-2 hover:bg-[#ea6c0a] active:scale-[0.98] transition-all disabled:opacity-40 shadow-md shadow-orange-200"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Send</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}