import {
  Users, BarChart2, Car, MessageSquare, Wrench, DollarSign,
  Zap, ShieldAlert, TrendingUp, Activity, ArrowUpRight, CheckCircle2
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { format, subDays } from "date-fns";

const COLORS = ["#0077cc", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function KpiCard({ label, value, icon: Icon, color, sub, trend }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {trend != null && trend > 0 && (
          <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
            <ArrowUpRight className="h-3 w-3" />+{trend}
          </span>
        )}
      </div>
      <div className="font-heading font-bold text-3xl text-foreground">{value}</div>
      <div className="text-muted-foreground text-xs mt-1 font-medium">{label}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="font-heading font-bold text-base text-foreground mb-3">{children}</h2>;
}

function FunnelRow({ label, value, max, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium">{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
      </div>
    </div>
  );
}

export default function FounderOverview({
  users, quotes, carChecks, posts, creditTransactions,
  mechanicProfiles, dirClicks, leads, quoteRequests, logbookEntries,
  onNavigateTab,
}) {
  const weekAgo = subDays(new Date(), 7).toISOString();
  const monthAgo = subDays(new Date(), 30).toISOString();

  // ── Revenue ──
  const purchases = creditTransactions.filter(t => t.action === "purchase" && t.amount_paid_aud);
  const totalRevenue = purchases.reduce((s, t) => s + (t.amount_paid_aud || 0), 0);
  const refunded = creditTransactions.filter(t => t.action === "refund" && t.amount_paid_aud).reduce((s, t) => s + (t.amount_paid_aud || 0), 0);
  const netRevenue = totalRevenue - refunded;
  const revenue30d = purchases.filter(t => t.created_date > monthAgo).reduce((s, t) => s + (t.amount_paid_aud || 0), 0);

  // ── Subscriptions (MRR estimate) ──
  const paidMechanics = mechanicProfiles.filter(m => m.subscription_tier === "starter" || m.subscription_tier === "featured");
  const mrrEstimate = mechanicProfiles.reduce((s, m) => s + (m.subscription_tier === "featured" ? 49.99 : m.subscription_tier === "starter" ? 29.99 : 0), 0);

  // ── Leads funnel ──
  const claimedLeads = leads.filter(l => l.status === "claimed");
  const completedJobs = leads.filter(l => l.job_completed);
  const claimRate = leads.length > 0 ? ((claimedLeads.length / leads.length) * 100).toFixed(0) : 0;

  // ── Attention needed ──
  const pendingVerifications = mechanicProfiles.filter(p => p.verification_status === "pending").length;
  const heldPosts = posts.filter(p => p.status === "held_for_review" || p.status === "pending").length;
  const pendingQuoteRequests = quoteRequests.filter(q => q.status === "pending").length;
  const negativeFeedback = quotes.filter(q => q.feedback === "not_helpful").length;

  const attentionItems = [
    { label: "Mechanic verifications pending", count: pendingVerifications, action: () => onNavigateTab("Verifications") },
    { label: "Community posts held for review", count: heldPosts, action: () => onNavigateTab("Data Management") },
    { label: "Unanswered quote requests", count: pendingQuoteRequests, action: null },
    { label: "Reports marked not helpful", count: negativeFeedback, action: null },
  ].filter(i => i.count > 0);

  // ── Charts data ──
  const growthData = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i);
    const dayStr = format(d, "yyyy-MM-dd");
    return {
      date: format(d, "dd MMM"),
      Users: users.filter(u => u.created_date?.startsWith(dayStr)).length,
      Quotes: quotes.filter(q => q.created_date?.startsWith(dayStr)).length,
      "Car Checks": carChecks.filter(c => c.created_date?.startsWith(dayStr)).length,
    };
  });

  const revenueData = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i);
    const dayStr = format(d, "yyyy-MM-dd");
    return {
      date: format(d, "dd MMM"),
      Revenue: purchases.filter(t => t.created_date?.startsWith(dayStr)).reduce((s, t) => s + (t.amount_paid_aud || 0), 0),
    };
  });

  const verdictData = [
    { name: "Fair", value: quotes.filter(q => q.verdict === "fair").length },
    { name: "High", value: quotes.filter(q => q.verdict === "high").length },
    { name: "Ripoff", value: quotes.filter(q => q.verdict === "ripoff").length },
  ].filter(d => d.value > 0);

  const stateData = (() => {
    const counts = {};
    [...quotes, ...carChecks].forEach(q => { if (q.state) counts[q.state] = (counts[q.state] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  })();

  const serviceData = (() => {
    const counts = {};
    quotes.forEach(q => { if (q.service_type) counts[q.service_type] = (counts[q.service_type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  })();

  const topClicks = (() => {
    const counts = {};
    dirClicks.forEach(c => { const k = c.business_name; if (k) counts[k] = (counts[k] || 0) + 1; });
    return Object.entries(counts).map(([name, clicks]) => ({ name, clicks })).sort((a, b) => b.clicks - a.clicks).slice(0, 8);
  })();

  const recentUsers = users.slice(0, 7);
  const activeMechanics = mechanicProfiles.filter(m => m.is_active).length;
  const avgBSMeter = quotes.length ? (quotes.reduce((s, q) => s + (q.bs_meter || 0), 0) / quotes.length).toFixed(1) : "—";

  return (
    <div className="space-y-8">
      {/* ── Attention needed ── */}
      {attentionItems.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <p className="font-heading font-bold text-sm text-amber-900">Needs your attention</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {attentionItems.map(item => (
              <button
                key={item.label}
                onClick={item.action || undefined}
                disabled={!item.action}
                className={`flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-amber-900 ${item.action ? "hover:bg-amber-100 cursor-pointer" : "cursor-default"}`}
              >
                <span className="h-5 w-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">{item.count}</span>
                {item.label}
                {item.action && <ArrowUpRight className="h-3 w-3 opacity-60" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Business KPIs ── */}
      <div>
        <SectionTitle>Business</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Net Revenue (all time)" value={`$${netRevenue.toFixed(2)}`} icon={DollarSign} color="bg-emerald-500" sub={refunded > 0 ? `$${refunded.toFixed(2)} refunded` : `${purchases.length} purchases`} />
          <KpiCard label="Revenue (30 days)" value={`$${revenue30d.toFixed(2)}`} icon={TrendingUp} color="bg-green-600" />
          <KpiCard label="Est. Mechanic MRR" value={`$${mrrEstimate.toFixed(0)}`} icon={Zap} color="bg-violet-500" sub={`${paidMechanics.length} paid subscriptions`} />
          <KpiCard label="Active Mechanics" value={activeMechanics} icon={Wrench} color="bg-blue-500" sub={`of ${mechanicProfiles.length} total`} />
        </div>
      </div>

      {/* ── Product KPIs ── */}
      <div>
        <SectionTitle>Product</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Total Users" value={users.length} icon={Users} color="bg-blue-500" trend={users.filter(u => u.created_date > weekAgo).length} sub="new this week" />
          <KpiCard label="Quote Checks" value={quotes.length} icon={BarChart2} color="bg-purple-500" trend={quotes.filter(q => q.created_date > weekAgo).length} sub="this week" />
          <KpiCard label="Car Checks" value={carChecks.length} icon={Car} color="bg-indigo-500" trend={carChecks.filter(c => c.created_date > weekAgo).length} sub="this week" />
          <KpiCard label="Logbook Entries" value={logbookEntries.length} icon={CheckCircle2} color="bg-teal-500" />
          <KpiCard label="Community Posts" value={posts.length} icon={MessageSquare} color="bg-amber-500" />
          <KpiCard label="Avg BS Meter" value={avgBSMeter} icon={Activity} color="bg-red-500" sub="/10" />
        </div>
      </div>

      {/* ── Revenue + Lead funnel ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <SectionTitle>Revenue (Last 14 Days)</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`$${v.toFixed(2)}`, "Revenue"]} />
              <Bar dataKey="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <SectionTitle>Mechanic Lead Funnel</SectionTitle>
          <div className="space-y-4 mt-2">
            <FunnelRow label="Leads created" value={leads.length} max={leads.length} color="bg-blue-500" />
            <FunnelRow label="Leads claimed" value={claimedLeads.length} max={leads.length} color="bg-violet-500" />
            <FunnelRow label="Jobs completed" value={completedJobs.length} max={leads.length} color="bg-emerald-500" />
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">Claim rate</span>
              <span className="font-heading font-bold text-lg">{claimRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Quote requests (mechanic ↔ user)</span>
              <span className="font-heading font-bold text-lg">{quoteRequests.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Activity chart ── */}
      <div className="bg-card border border-border rounded-xl p-5">
        <SectionTitle>Activity Over Last 14 Days</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={growthData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <defs>
              {["Users", "Quotes", "Car Checks"].map((k, i) => (
                <linearGradient key={k} id={`fgrad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[i]} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={COLORS[i]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="Users" stroke={COLORS[0]} fill="url(#fgrad0)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="Quotes" stroke={COLORS[1]} fill="url(#fgrad1)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="Car Checks" stroke={COLORS[2]} fill="url(#fgrad2)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Verdicts + states ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <SectionTitle>Quote Verdicts</SectionTitle>
          {verdictData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={verdictData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {verdictData.map((_, i) => <Cell key={i} fill={["#22c55e", "#f59e0b", "#ef4444"][i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-sm py-10 text-center">No data yet.</p>}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <SectionTitle>Checks by State</SectionTitle>
          {stateData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stateData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="value" fill="#0077cc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-sm py-10 text-center">No data yet.</p>}
        </div>
      </div>

      {/* ── Top services + recent signups ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <SectionTitle>Top Services Checked</SectionTitle>
          <div className="space-y-2">
            {serviceData.length > 0 ? serviceData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-4 flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium truncate" title={s.name}>{s.name}</span>
                    <span className="text-muted-foreground ml-2 flex-shrink-0">{s.value}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${(s.value / serviceData[0].value) * 100}%` }} />
                  </div>
                </div>
              </div>
            )) : <p className="text-muted-foreground text-sm text-center py-6">No data yet.</p>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <SectionTitle>Recent Sign-ups</SectionTitle>
          <div className="space-y-3">
            {recentUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                  {(u.full_name || u.email || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{u.full_name || "—"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                </div>
                <span className="text-[11px] text-muted-foreground flex-shrink-0">{format(new Date(u.created_date), "dd MMM")}</span>
              </div>
            ))}
            {recentUsers.length === 0 && <p className="text-muted-foreground text-sm text-center py-6">No users yet.</p>}
          </div>
        </div>
      </div>

      {/* ── Directory clicks ── */}
      <div className="bg-card border border-border rounded-xl p-5">
        <SectionTitle>Most Clicked Mechanics (Directory)</SectionTitle>
        {topClicks.length > 0 ? (
          <div className="space-y-2">
            {topClicks.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                <span className="flex-1 text-sm font-medium truncate">{c.name}</span>
                <span className="text-xs font-bold text-accent">{c.clicks} clicks</span>
                <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${(c.clicks / topClicks[0].clicks) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-muted-foreground text-sm text-center py-4">No directory clicks recorded yet.</p>}
      </div>
    </div>
  );
}