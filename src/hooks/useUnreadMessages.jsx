import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fireMessageNotification } from "@/lib/notifications";

/**
 * Tracks unread message count for the current user (regular user role only)
 * and fires push notifications globally when a mechanic replies — works
 * even when the user is on another page.
 *
 * Unread = QuoteRequest where mechanic has responded but user hasn't replied
 * back yet, plus pending DiagnosticOffers.
 */
export function useUnreadMessages(user) {
  const [unreadCount, setUnreadCount] = useState(0);

  // Initial load + recompute helper
  useEffect(() => {
    if (!user?.email) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    const computeUnread = async () => {
      try {
        const [quoteReqs, diagOffers] = await Promise.all([
          base44.entities.QuoteRequest.filter({ user_email: user.email }, "-updated_date", 100),
          base44.entities.DiagnosticOffer.filter({ status: "pending" }, "-updated_date", 100),
        ]);

        // QuoteRequest is unread if: mechanic responded AND the last message in convo is from mechanic
        const unreadQRs = quoteReqs.filter(qr => {
          if (qr.hidden_by_user) return false;
          if (!qr.mechanic_response) return false;
          const conv = qr.conversation || [];
          if (conv.length === 0) return !qr.user_reply;
          return conv[conv.length - 1]?.role === "mechanic";
        }).length;

        // Diagnostic offers — only those for this user's diagnostic requests
        const myDiagRequests = await base44.entities.DiagnosticRequest.filter(
          { user_email: user.email },
          "-updated_date",
          50
        );
        const myDiagIds = new Set(myDiagRequests.map(r => r.id));
        const unreadDiag = diagOffers.filter(o => myDiagIds.has(o.diagnostic_request_id)).length;

        if (!cancelled) setUnreadCount(unreadQRs + unreadDiag);
      } catch {
        // ignore
      }
    };

    computeUnread();

    // Subscribe to QuoteRequest updates — fire notification + recompute count
    const unsubQR = base44.entities.QuoteRequest.subscribe((event) => {
      if (event.type === "update" && event.data && event.data.user_email === user.email) {
        const newData = event.data;
        const isMechanicMessage =
          newData.mechanic_followup ||
          (newData.mechanic_response && newData.status === "responded");

        if (isMechanicMessage) {
          const preview = newData.mechanic_followup || newData.mechanic_response || "";
          fireMessageNotification({
            mechanicName: newData.mechanic_business_name || "A mechanic",
            preview: preview.slice(0, 80),
            onClick: () => {
              window.focus();
              window.location.href = "/my-requests";
            },
          });
        }
        computeUnread();
      } else if (event.type === "create" || event.type === "delete") {
        computeUnread();
      }
    });

    // Subscribe to DiagnosticOffer changes
    const unsubDO = base44.entities.DiagnosticOffer.subscribe(() => {
      computeUnread();
    });

    return () => {
      cancelled = true;
      unsubQR?.();
      unsubDO?.();
    };
  }, [user?.email]);

  return unreadCount;
}