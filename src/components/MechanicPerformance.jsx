import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, CheckCircle, DollarSign, TrendingUp, Target, Clock, MessageSquare, Award } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";

function StatCard({ icon: Icon, label, value, sublabel, color = "text-foreground" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      </div>
      <p className={`text-2xl font-heading font-bold ${color}`}>{value}</p>
      {sublabel && <p className="text-[11px] text-muted-foreground mt-1">{sublabel}</p>}
    </div>
  );
}

export default function MechanicPerformance({ profile }) {
  const [loading, setLoading] = useState(true);
  const [claimedLeads, setClaimedLeads] = useState([]);
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [range, setRange] = useState(30); // days

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      setLoading(true);
      try {
        const [leads, quotes] = await Promise.all([
          base44.entities.MechanicLead.filter({ claimed_by_profile_id: profile.id }, "-created_date", 500),
          base44.entities.QuoteRequest.filter({ mechanic_profile_id: profile.id }, "-created_date", 500),
        ]);
        setClaimedLeads(leads || []);
        setQuoteRequests(quotes || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.id]);

  const metrics = useMemo(() => {
    const cutoff = startOfDay(subDays(new Date(), range));
    const inRange = (d) => d && new Date(d) >= cutoff;

    const leadsInRange = claimedLeads.filter(l => inRange(l.created_date));
    const quotesInRange = quoteRequests.filter(q => inRange(q.created_date));

    const completed = leadsInRange.filter(l => l.job_completed);
    const totalRevenue = completed.reduce((sum, l) => sum + (Number(l.agreed_price) || 0), 0);
    const respondedQuotes = quotesInRange.filter(q => q.status === "responded");
    const conversionRate = leadsInRange.length > 0
      ? Math.round((completed.length / leadsInRange.length) * 100)
      : 0;
    const responseRate = quotesInRange.length > 0
      ? Math.round((respondedQuotes.length / quotesInRange.length) * 100)
      : 0;
    const avgJobValue = completed.length > 0 ? totalRevenue / completed.length : 0;

    // Daily activity for spark chart (last `range` days)
    const dailyMap = {};
    for (let i = range - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      dailyMap[d] = 0;
    }
    leadsInRange.forEach(l => {
      const d = format(new Date(l.created_date), "yyyy-MM-dd");
      if (dailyMap[d] !== undefined) dailyMap[d] += 1;
    });
    const dailySeries = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));
    const maxDaily = Math.max(1, ...dailySeries.map(d => d.count));

    return {
      leadsClaimed: leadsInRange.length,
      completed: completed.length,
      pending: leadsInRange.length - completed.length,
      totalRevenue,
      avgJobValue,
      conversionRate,
      quoteRequestsReceived: quotesInRange.length,
      respondedQuotes: respondedQuotes.length,
      responseRate,
      dailySeries,
      maxDaily,
    };
  }, [claimedLeads, quoteRequests, range]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-4 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  const aud = (n) => n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-muted-foreground mr-1">Showing:</p>
        {[7, 30, 90].map(d => (
          <button
            key={d}
            onClick={() => setRange(d)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${
              range === d
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-muted-foreground border-border hover:border-primary/40"
            }`}
          >Last {d} days</button>
        ))}
      </div>

      {/* Top KPI grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Zap} label="Leads Claimed" value={metrics.leadsClaimed} sublabel={`${metrics.pending} in progress`} />
        <StatCard icon={CheckCircle} label="Jobs Completed" value={metrics.completed} sublabel={`${metrics.conversionRate}% conversion`} color="text-green-600" />
        <StatCard icon={DollarSign} label="Revenue" value={aud(metrics.totalRevenue)} sublabel={`${aud(metrics.avgJobValue)} avg job`} color="text-green-600" />
        <StatCard icon={MessageSquare} label="Quote Requests" value={metrics.quoteRequestsReceived} sublabel={`${metrics.responseRate}% response rate`} />
      </div>

      {/* Activity chart */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Lead Activity</p>
          </div>
          <p className="text-xs text-muted-foreground">{metrics.dailySeries.length} days</p>
        </div>
        <div className="flex items-end gap-0.5 h-24">
          {metrics.dailySeries.map((d) => (
            <div
              key={d.date}
              className="flex-1 rounded-t bg-accent/70 hover:bg-accent transition-colors min-h-[2px]"
              style={{ height: `${(d.count / metrics.maxDaily) * 100}%` }}
              title={`${d.date}: ${d.count} ${d.count === 1 ? "lead" : "leads"}`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>{metrics.dailySeries[0] && format(new Date(metrics.dailySeries[0].date), "dd MMM")}</span>
          <span>Today</span>
        </div>
      </div>

      {/* Conversion funnel */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Conversion Funnel</p>
        </div>
        <FunnelRow label="Leads Claimed" value={metrics.leadsClaimed} max={metrics.leadsClaimed} />
        <FunnelRow label="Jobs Completed" value={metrics.completed} max={metrics.leadsClaimed} />
        <FunnelRow label="Revenue Generated" value={metrics.totalRevenue > 0 ? metrics.completed : 0} max={metrics.leadsClaimed} suffix={` (${aud(metrics.totalRevenue)})`} />
      </div>

      {/* Account summary */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Account Summary</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Subscription</p>
            <p className="font-bold capitalize">{profile?.subscription_tier || "free"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Credits Balance</p>
            <p className="font-bold">{profile?.mechanic_credits ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">All-Time Leads</p>
            <p className="font-bold">{claimedLeads.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">All-Time Completed</p>
            <p className="font-bold">{claimedLeads.filter(l => l.job_completed).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FunnelRow({ label, value, max, suffix = "" }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="text-muted-foreground">{value}{suffix}</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}