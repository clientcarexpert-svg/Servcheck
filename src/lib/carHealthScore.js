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

function monthsSince(dateStr) {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (isNaN(t)) return null;
  return (Date.now() - t) / MS_PER_MONTH;
}

export function calculateCarHealthScore(logbookEntries = [], quoteChecks = [], lastOdometer = null) {
  let score = 0;
  const factors = [];

  const latest = logbookEntries[0] || null;
  const monthsAgo = latest ? monthsSince(latest.service_date) : null;

  // ── 1. Service history exists (+30) ──
  if (!latest) {
    factors.push({
      name: "No services recorded yet",
      value: -30,
      reason: "no services have been recorded for this car yet",
      action: "add your last service to start building your score",
    });
    return {
      score: 0,
      biggestFactor: factors[0],
      factors,
    };
  }
  score += 30;
  factors.push({
    name: "Service history recorded",
    value: 30,
    reason: "you have service history recorded for this car",
    action: "keep logging services as they happen",
  });

  // ── 2. Recency (+25 within 6 months, +15 within 12) ──
  if (monthsAgo !== null && monthsAgo <= 6) {
    score += 25;
    factors.push({
      name: "Serviced in the last 6 months",
      value: 25,
      reason: "your last recorded service was within 6 months",
      action: "keep logging services as they happen",
    });
  } else if (monthsAgo !== null && monthsAgo <= 12) {
    score += 15;
    factors.push({
      name: `Last service ${Math.floor(monthsAgo)} months ago`,
      value: 15,
      reason: `your last recorded service was ${Math.floor(monthsAgo)} months ago`,
      action: "record your next service to earn the full recency points",
    });
  } else {
    const m = monthsAgo === null ? null : Math.floor(monthsAgo);
    factors.push({
      name: m !== null ? `Last recorded service was ${m} months ago` : "Last service has no date recorded",
      value: -25,
      reason: m !== null ? `your last recorded service was ${m} months ago` : "your last service entry has no date",
      action: "add your latest service to boost your score",
    });
  }

  // ── 3. Next service due recorded (+15) ──
  const hasNextDue = !!(latest.next_service_months || latest.next_service_km);
  if (hasNextDue) {
    score += 15;
    factors.push({
      name: "Next service due is recorded",
      value: 15,
      reason: "you've recorded when your next service is due",
      action: "keep your next-due details updated after each service",
    });
  } else {
    factors.push({
      name: "Next service due not recorded",
      value: -15,
      reason: "you haven't recorded when your next service is due",
      action: "add a next-due date or odometer to earn 15 points",
    });
  }

  // ── 4. On schedule (+10 if next due recorded and not overdue) ──
  if (hasNextDue) {
    let overdue = false;
    if (latest.next_service_months && monthsAgo !== null && monthsAgo > latest.next_service_months) overdue = true;
    if (latest.next_service_km && lastOdometer && lastOdometer >= latest.next_service_km) overdue = true;
    if (!overdue) {
      score += 10;
      factors.push({
        name: "On schedule — no service overdue",
        value: 10,
        reason: "your next service isn't due yet",
        action: "record it when done to keep these points",
      });
    } else {
      factors.push({
        name: "A predicted service is overdue",
        value: -10,
        reason: "a predicted service for this car is overdue",
        action: "record it once done to earn those points back",
      });
    }
  }

  // ── 5. Receipt coverage (up to +20, proportional) ──
  const receiptCount = logbookEntries.filter(e => e.receipt_url).length;
  const receiptBonus = Math.round((receiptCount / logbookEntries.length) * 20);
  if (receiptBonus > 0) {
    score += receiptBonus;
    factors.push({
      name: `Receipts on ${receiptCount} of ${logbookEntries.length} service${logbookEntries.length !== 1 ? "s" : ""}`,
      value: receiptBonus,
      reason: `${receiptCount} of your ${logbookEntries.length} recorded service${logbookEntries.length !== 1 ? "s have" : " has"} a receipt attached`,
      action: receiptBonus < 20 ? "attach receipts to your other entries to earn the full 20 points" : "keep attaching receipts to stay fully verified",
    });
  } else {
    factors.push({
      name: "No receipts attached",
      value: -20,
      reason: "none of your recorded services have a receipt attached",
      action: "attach receipts to your logbook entries to earn up to 20 points",
    });
  }

  score = Math.max(0, Math.min(100, score));

  // Biggest factor by absolute impact, negatives first on tie
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