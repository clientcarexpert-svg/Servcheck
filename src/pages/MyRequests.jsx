import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { MessageSquare, ChevronRight, Send } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);


  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      if (!user) return;
      const reqs = await base44.entities.QuoteRequest.filter({ user_email: user.email }, "-created_date", 50);
      setRequests(reqs);
      setLoading(false);
    };
    load();

    // Real-time updates when mechanic replies
    const unsub = base44.entities.QuoteRequest.subscribe((event) => {
      if (event.type === "update" && event.data) {
        setRequests(prev => prev.map(r => r.id === event.id ? { ...r, ...event.data } : r));
      }
    });
    return unsub;
  }, []);



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="rounded-2xl bg-gradient-to-br from-[#1a237e] to-[#1565c0] p-5 mb-8">
        <h1 className="font-heading font-bold text-xl text-white mb-1">My Quote Requests</h1>
        <p className="text-blue-200 text-sm">Your conversation with mechanics</p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-semibold">No requests yet</p>
          <p className="text-xs mt-1">When you ask a mechanic for a quote, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => {
            const isExpanded = expandedId === r.id;
            const hasReply = !!r.mechanic_response;

            // Build full thread from conversation array or legacy fields
            const thread = r.conversation && r.conversation.length > 0
              ? r.conversation
              : [
                  r.notes ? { role: "user", message: r.notes, timestamp: r.created_date } : null,
                  r.mechanic_response ? { role: "mechanic", message: r.mechanic_response + (r.mechanic_quote ? ` · Quote: $${r.mechanic_quote.toLocaleString()}` : ""), timestamp: null } : null,
                  r.user_reply ? { role: "user", message: r.user_reply, timestamp: null } : null,
                  r.mechanic_followup ? { role: "mechanic", message: r.mechanic_followup, timestamp: null } : null,
                ].filter(Boolean);

            const lastRole = thread.length > 0 ? thread[thread.length - 1].role : null;
            const canReply = hasReply && r.status !== "declined";
            const hasNewMechanicMessage = hasReply && lastRole === "mechanic";

            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border bg-card overflow-hidden ${hasNewMechanicMessage && !r.user_reply ? "border-accent" : ""}`}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  className="w-full flex items-center justify-between px-4 py-4 text-left gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{r.mechanic_business_name || "Mechanic"}</p>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                        r.status === "responded" ? "bg-emerald-100 text-emerald-700" :
                        r.status === "declined" ? "bg-red-100 text-red-600" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {r.status === "responded" ? "Mechanic responded ✓" : r.status === "declined" ? "Declined" : "Awaiting reply"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.service_type} · {r.car_year} {r.car_make} {r.car_model}</p>
                    <p className="text-xs text-muted-foreground">{r.suburb}, {r.state}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canReply && (
                      <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    )}
                    <span className="text-[11px] text-muted-foreground">{r.created_date ? format(new Date(r.created_date), "dd MMM") : ""}</span>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                    {r.original_quoted_price && (
                      <div className="bg-secondary/50 rounded-lg p-3 text-xs">
                        <span className="text-muted-foreground">Original quote: </span>
                        <span className="font-bold">${r.original_quoted_price?.toLocaleString()}</span>
                      </div>
                    )}

                    {/* Full conversation thread */}
                    {thread.length > 0 ? (
                      <div className="space-y-2">
                        {thread.map((msg, i) => (
                          <div
                            key={i}
                            className={`rounded-lg p-3 text-xs ${
                              msg.role === "user"
                                ? "bg-secondary/60 text-foreground"
                                : "bg-emerald-50 border border-emerald-200 text-emerald-900"
                            }`}
                          >
                            <p className="font-semibold mb-0.5">{msg.role === "user" ? "You" : r.mechanic_business_name || "Mechanic"}:</p>
                            <p>{msg.message}</p>
                            {msg.timestamp && (
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {format(new Date(msg.timestamp), "dd MMM, h:mm a")}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : r.status === "declined" ? (
                      <p className="text-xs text-muted-foreground italic">This mechanic declined your request.</p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Waiting for the mechanic to respond…</p>
                    )}

                    {/* Direct users to Messages to reply */}
                    {canReply && (
                      <Link to="/my-requests">
                        <Button className="w-full h-9 text-xs gap-1.5 bg-[#f97316] hover:bg-[#ea6c0a] text-white font-bold">
                          <MessageSquare className="h-3.5 w-3.5" /> Open in Messages to reply
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}