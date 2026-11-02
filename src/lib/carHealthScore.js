/**
 * Car Health Score (0-100) — maintenance tracking indicator only.
 * Reflects how well maintenance is recorded in ServCheck.
 * It is NOT a measure of vehicle safety, roadworthiness, or resale value.
 *
 * Earned-points model — you start at 0 and earn up to 100:
 *   +30  at least one service recorded
 *   +25  last service within 6 months (+15 if within 12 months)
 *   +15  next service due (date or odometer) is recorded
 *   +10  on schedule (next service due recorded and not yet overdue)
 *   +20  receipt coverage — proportion of logbook entries with a receipt attached
 *
 * Why this shape:
 *   - Every point is earned by evidence, so an empty logbook scores 0, not 60.
 *   - Recording your next due date is always net positive (+15), even if you
 *     later run overdue (you just don't earn the +10 on-schedule points).
 *   - Receipts are scored by coverage, not count — verifying 1 of 1 entries
 *     is better proof than 2 of 10.
 */

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.44;
const DEFAULT_SERVICE_MONTHS = 12;
const DEFAULT_SERVICE_KM = 15000;

/**
 * Car Health Score (0-100) built from the whole logbook. Five pillars, each worth points:
 *
 *   30  SERVICE CURRENCY   Is the car due or overdue right now? Uses months AND km since the
 *                          last service against its interval (the entry's own next-service
 *                          numbers, else 12 months / 15,000 km). On time = full points,
 *                          falls in a straight line to 0 at double the interval.
 *   25  REGULARITY         How many gaps between recorded services were on time
 *                          (15 months or 18,750 km or less). Measures a habit, not a one-off.
 *   15  EVIDENCE           Share of services with a receipt attached.
 *   15  HISTORY DEPTH      Services recorded vs. how many we expect for the car's age
 *                          (about one a year, between 1 and 5).
 *   15  WEAR ITEMS         Parts recorded with a next-due target (brakes, tyres, battery,
 *                          belts, fluids). Points for tracking them and for none being overdue.
 *
 * Integrity check: if the odometer goes backwards between entries by more than 500 km,
 * 15 points are removed and the score card tells the owner to check the entries.
 *
 * It measures how well the car is maintained and documented. It is NOT a safety check,
 * roadworthiness test or valuation.
 */

const parseTime = (d) => {
  if (!d) return null;
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? null : t;
};
const monthsBetween = (a, b) => (b - a) / MS_PER_MONTH;
const num = (v) => (Number(v) > 0 ? Number(v) : null);

// 1 or under = full points, 2 or over = 0, straight line between.
const ratioToPoints = (ratio, max) => (ratio <= 1 ? max : ratio >= 2 ? 0 : max * (2 - ratio));

export function calculateCarHealthScore(logbookEntries = [], quoteChecks = [], lastOdometer = null, carYear = null) {
  const now = Date.now();
  const factors = [];
  let score = 0;

  // Newest first, undated entries last.
  const entries = [...logbookEntries]
    .map((e) => ({ ...e, _t: parseTime(e.service_date) }))
    .sort((a, b) => (b._t ?? -Infinity) - (a._t ?? -Infinity));

  if (entries.length === 0) {
    const f = {
      name: "No services recorded yet",
      value: -100,
      reason: "no services have been recorded for this car yet",
      action: "add your last service to start building your score",
    };
    return { score: 0, biggestFactor: f, factors: [f] };
  }

  // Each pillar adds an "earned" factor and a "lost" factor so the owner sees both sides.
  const addPillar = (name, earned, max, reason, action) => {
    const pts = Math.max(0, Math.min(max, Math.round(earned)));
    score += pts;
    if (pts > 0) factors.push({ name, value: pts, reason, action });
    if (pts < max) factors.push({ name: `${name} (${max - pts} points missing)`, value: -(max - pts), reason, action });
  };

  const latest = entries[0];
  const odoNow = num(lastOdometer);
  const odoThen = num(latest.odometer);

  // ── 1. Service currency (30) ──
  const dueMonths = num(latest.next_service_months) || DEFAULT_SERVICE_MONTHS;
  const dueKmAbs = num(latest.next_service_km) || (odoThen ? odoThen + DEFAULT_SERVICE_KM : null);
  const ratios = [];
  const monthsAgo = latest._t ? monthsBetween(latest._t, now) : null;
  if (monthsAgo !== null) ratios.push(monthsAgo / dueMonths);
  if (odoNow && odoThen && dueKmAbs && dueKmAbs > odoThen) ratios.push((odoNow - odoThen) / (dueKmAbs - odoThen));
  const worst = ratios.length ? Math.max(...ratios) : null;
  const currencyPts = worst === null ? 0 : ratioToPoints(worst, 30);
  const monthsText = monthsAgo === null ? "an unknown time" : `${Math.floor(monthsAgo)} month${Math.floor(monthsAgo) === 1 ? "" : "s"}`;
  addPillar(
    worst === null ? "Last service has no date" : worst <= 1 ? "Service is up to date" : worst < 2 ? "Service is overdue" : "Service is well overdue",
    currencyPts, 30,
    worst === null ? "your latest service entry has no date, so we can't tell if the car is due" : `your last recorded service was ${monthsText} ago`,
    worst !== null && worst <= 1 ? "record your next service when it's done" : "book a service, then add it to your logbook"
  );

  // ── 2. Regularity (25) ──
  const dated = entries.filter((e) => e._t !== null).sort((a, b) => a._t - b._t);
  if (dated.length < 2) {
    addPillar("Not enough history to measure regularity", 12, 25,
      "regularity needs at least two dated services",
      "add your earlier services (use bulk add) to earn up to 25 points");
  } else {
    let onTime = 0;
    for (let i = 1; i < dated.length; i++) {
      const gapMonths = monthsBetween(dated[i - 1]._t, dated[i]._t);
      const a = num(dated[i - 1].odometer);
      const b = num(dated[i].odometer);
      const gapKm = a && b && b >= a ? b - a : null;
      if (gapMonths <= DEFAULT_SERVICE_MONTHS * 1.25 && (gapKm === null || gapKm <= DEFAULT_SERVICE_KM * 1.25)) onTime++;
    }
    const gaps = dated.length - 1;
    addPillar(
      `Serviced on time ${onTime} of ${gaps} time${gaps === 1 ? "" : "s"}`,
      (onTime / gaps) * 25, 25,
      `${onTime} of ${gaps} gaps between your recorded services were within the normal interval`,
      onTime === gaps ? "keep servicing at regular intervals" : "service on time going forward, and add any missing earlier services"
    );
  }

  // ── 3. Evidence: receipts (15) ──
  const receiptCount = entries.filter((e) => e.receipt_url).length;
  addPillar(
    `Receipts on ${receiptCount} of ${entries.length} service${entries.length === 1 ? "" : "s"}`,
    (receiptCount / entries.length) * 15, 15,
    `${receiptCount} of your ${entries.length} recorded service${entries.length === 1 ? " has" : "s have"} a receipt attached`,
    receiptCount === entries.length ? "keep attaching receipts" : "attach receipts to your other entries"
  );

  // ── 4. History depth (15) ──
  const age = num(carYear) ? new Date().getFullYear() - Number(carYear) : 3;
  const expected = Math.max(1, Math.min(5, age));
  addPillar(
    `${entries.length} service${entries.length === 1 ? "" : "s"} recorded (about ${expected} expected)`,
    15 * Math.min(1, entries.length / expected), 15,
    "a fuller service history makes the score and the car more trustworthy",
    entries.length >= expected ? "keep logging every service" : "add your earlier services to complete the history"
  );

  // ── 5. Wear items (15) ──
  const latestByPart = new Map();
  for (const e of entries) {
    for (const p of e.parts_replaced || []) {
      const key = String(p.part || "").trim().toLowerCase();
      if (key && !latestByPart.has(key)) latestByPart.set(key, { part: p, entry: e });
    }
  }
  const tracked = [...latestByPart.values()].filter(({ part }) => part.next_due_km || part.next_due_months);
  if (tracked.length === 0) {
    addPillar("No wear items tracked", 0, 15,
      "no parts have a next-due target recorded",
      "when you replace a part (tyres, brakes, battery, belts), add when it is next due");
  } else {
    let overdue = 0;
    for (const { part, entry } of tracked) {
      const lateByTime = num(part.next_due_months) && entry._t !== null && monthsBetween(entry._t, now) > Number(part.next_due_months);
      const lateByKm = num(part.next_due_km) && odoNow && odoNow >= Number(part.next_due_km);
      if (lateByTime || lateByKm) overdue++;
    }
    const share = overdue / tracked.length;
    addPillar(
      overdue === 0 ? `${tracked.length} wear item${tracked.length === 1 ? "" : "s"} tracked, none overdue` : `${overdue} of ${tracked.length} tracked wear items overdue`,
      8 * Math.min(1, tracked.length / 3) + 7 * (1 - share), 15,
      overdue === 0 ? "the parts you track are all within their due dates" : "some parts you track are past their due date or odometer",
      overdue === 0 ? "keep your part reminders updated" : "replace or inspect the overdue parts and update the logbook"
    );
  }

  // ── Integrity: odometer going backwards ──
  const withOdo = dated.filter((e) => num(e.odometer));
  let maxSeen = 0;
  let rollback = false;
  for (const e of withOdo) {
    const o = Number(e.odometer);
    if (maxSeen - o > 500) rollback = true;
    maxSeen = Math.max(maxSeen, o);
  }
  if (rollback) {
    score -= 15;
    factors.push({
      name: "Odometer goes backwards between entries",
      value: -15,
      reason: "a later service shows a lower odometer reading than an earlier one",
      action: "check your entries for typos. A genuine rollback would hurt resale value",
    });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const sorted = [...factors].sort((a, b) => Math.abs(b.value) - Math.abs(a.value) || a.value - b.value);
  const biggestFactor = sorted[0] || {
    name: "All maintenance signals up to date",
    value: 0,
    reason: "your recorded maintenance is fully up to date",
    action: "keep logging services as they happen",
  };

  return { score, biggestFactor, factors };
}

export function getHealthScoreLabel(score) {
  if (score >= 80) return "Well Tracked";
  if (score >= 50) return "Partly Tracked";
  return "Needs Updating";
}

export function getHealthScoreHex(score) {
  if (score >= 80) return "#16a34a"; // green-600
  if (score >= 50) return "#ea580c"; // orange-600
  return "#dc2626"; // red-600
}

export function getHealthScoreColor(score) {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-orange-600";
  return "text-red-600";
}

// Kept for backward compat — use getHealthScoreHex for SVG
export function getHealthScoreRingColor(score) {
  if (score >= 80) return "stroke-green-600";
  if (score >= 50) return "stroke-orange-600";
  return "stroke-red-600";
}