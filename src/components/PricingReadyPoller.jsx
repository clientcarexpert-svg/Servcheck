/**
 * PricingReadyPoller
 * 
 * Runs silently in the background. Every 30 seconds it checks if any
 * queued pricing requests have been fulfilled. If so, fires a push notification
 * and removes the item from the local queue.
 */

import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  getPricingQueueItems,
  removePricingQueueItem,
  firePricingReadyNotification,
} from "@/lib/notifications";

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export default function PricingReadyPoller() {
  useEffect(() => {
    const poll = async () => {
      const items = getPricingQueueItems();
      if (items.length === 0) return;

      for (const item of items) {
        try {
          const res = await base44.functions.invoke("checkPricingCache", item.params);
          if (res.data?.status === "hit") {
            firePricingReadyNotification(item);
            removePricingQueueItem(item.key);
          }
        } catch (_) {
          // silently ignore — will retry next poll
        }
      }
    };

    // Poll immediately then on interval
    poll();
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return null; // no UI
}