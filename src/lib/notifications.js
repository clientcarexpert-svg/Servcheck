const PENDING_FOLLOWUP_KEY = "servcheck_pending_followup";

// Silently request permission — used on PWA install, no modal shown
export async function requestNotificationPermissionSilently() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted" || Notification.permission === "denied") return;
  await Notification.requestPermission();
}

// Listen for PWA install event and auto-request permission
export function initPushOnInstall() {
  window.addEventListener("appinstalled", async () => {
    await requestNotificationPermissionSilently();
  });

  // Also request once if already installed as standalone (opened from home screen)
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  if (isStandalone) {
    requestNotificationPermissionSilently();
  }
}

export function scheduleServiceFollowUp(quoteData) {
  const followUp = {
    quoteId: quoteData.id,
    car: `${quoteData.car_year} ${quoteData.car_make} ${quoteData.car_model}`,
    service: quoteData.service_type,
    notified: false,
    dueAt: Date.now() + 3 * 60 * 60 * 1000, // 3 hours
  };
  localStorage.setItem(PENDING_FOLLOWUP_KEY, JSON.stringify(followUp));
}

// Called on a polling interval — fires native notification once when due
export function checkAndFireFollowUpNotification() {
  try {
    const raw = localStorage.getItem(PENDING_FOLLOWUP_KEY);
    if (!raw) return;
    const followUp = JSON.parse(raw);
    if (followUp.notified) return;
    if (Date.now() < followUp.dueAt) return;

    followUp.notified = true;
    localStorage.setItem(PENDING_FOLLOWUP_KEY, JSON.stringify(followUp));

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Did you get your car serviced?", {
        body: `You checked a quote for ${followUp.service} on your ${followUp.car}. Open ServCheck to log it in your service history.`,
        icon: "/favicon.ico",
      });
    }
  } catch {
    // ignore
  }
}

export function dismissFollowUp() {
  localStorage.removeItem(PENDING_FOLLOWUP_KEY);
}

// ─── New lead notifications (mechanics) ──────────────────────────────────────

export function fireNewLeadNotification({ vehicle, service, suburb, state }) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const location = suburb ? `${suburb}, ${state}` : state || "";
  new Notification("🔧 New job lead near you!", {
    body: `${vehicle ? vehicle + " — " : ""}${service || "Service request"}${location ? ` in ${location}` : ""}. Open ServCheck to claim it.`,
    icon: "/favicon.ico",
    tag: "new-lead",
  });
}

// ─── Message notifications ────────────────────────────────────────────────────

export function fireMessageNotification({ mechanicName, preview, onClick }) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const n = new Notification(`💬 ${mechanicName} sent you a message`, {
    body: preview || "Tap to view your conversation.",
    icon: "/favicon.ico",
    tag: "mechanic-message",
  });
  if (onClick) n.onclick = onClick;
}

export function fireMechanicMessageNotification({ customerName, preview, onClick }) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const n = new Notification(`💬 ${customerName} replied`, {
    body: preview || "Tap to view the conversation.",
    icon: "/favicon.ico",
    tag: "customer-reply",
  });
  if (onClick) n.onclick = onClick;
}

// ─── Pricing-ready queue notifications ───────────────────────────────────────

const PRICING_QUEUE_KEY = "servcheck_pricing_queue";

/**
 * Register a pending pricing request so we can poll + notify when ready.
 * @param {object} params - { car_make, car_model, car_year, service_type, state, suburb }
 * @param {number} queuePosition - estimated position in queue
 * @param {number} etaMinutes - estimated minutes until ready
 */
export function registerPricingQueueItem(params, queuePosition, etaMinutes) {
  const items = getPricingQueueItems();
  const key = `${params.car_make}|${params.car_model}|${params.car_year}|${params.service_type}|${params.state}|${params.suburb}`.toLowerCase();
  // Don't duplicate
  if (items.find(i => i.key === key)) return;
  items.push({
    key,
    params,
    queuePosition,
    etaMinutes,
    enqueuedAt: Date.now(),
    notified: false,
  });
  localStorage.setItem(PRICING_QUEUE_KEY, JSON.stringify(items));
}

export function getPricingQueueItems() {
  try {
    return JSON.parse(localStorage.getItem(PRICING_QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function removePricingQueueItem(key) {
  const items = getPricingQueueItems().filter(i => i.key !== key);
  localStorage.setItem(PRICING_QUEUE_KEY, JSON.stringify(items));
}

export function firePricingReadyNotification(item) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const { car_make, car_model, car_year, service_type, suburb } = item.params;
  new Notification("🔍 Pricing data is ready!", {
    body: `We found current mechanic prices for ${service_type} on your ${car_year} ${car_make} ${car_model} in ${suburb}. Tap to check your quote now.`,
    icon: "/favicon.ico",
    tag: item.key,
  });
}