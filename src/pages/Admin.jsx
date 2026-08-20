import { useState, useEffect } from "react";
import SEOHead from "../components/SEOHead";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import AdminCreditsManager from "@/components/AdminCreditsManager";
import MechanicVerificationQueue from "@/components/MechanicVerificationQueue";
import AdminSuburbWaitlist from "@/components/AdminSuburbWaitlist";
import AdminSignupIPReview from "@/components/AdminSignupIPReview";
import AdminHeldPosts from "@/components/AdminHeldPosts";
import FounderOverview from "@/components/admin/FounderOverview";
import {
  Trash2, Users, BarChart2, MessageSquare, ShieldCheck,
  Car, Wrench, Building2, CheckCircle, Search, RefreshCw, Mail,
  TrendingUp, MousePointerClick, Map, Activity, ArrowUpRight, RotateCcw, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { format, subDays, parseISO, startOfDay } from "date-fns";

const MAIN_TABS = ["Overview", "Users & Analytics", "Data Management", "Workspace", "B2B", "Verifications", "Refunds", "Waitlist"];
const COLORS = ["#0077cc", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <Icon className="h-4.5 w-4.5 text-white h-5 w-5" />
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

export default function Admin() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState("Overview");
  const [usersSubTab, setUsersSubTab] = useState("Overview");
  const [dataSubTab, setDataSubTab] = useState("Quotes");
  const [workspaceSubTab, setWorkspaceSubTab] = useState("Workshops");
  const [b2bSubTab, setB2bSubTab] = useState("Mobile Mechanics");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refundingId, setRefundingId] = useState(null);
  const [refundReason, setRefundReason] = useState({});

  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [carChecks, setCarChecks] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [dirClicks, setDirClicks] = useState([]);
  const [creditTransactions, setCreditTransactions] = useState([]);
  const [mechanicProfiles, setMechanicProfiles] = useState([]);
  const [logbookEntries, setLogbookEntries] = useState([]);
  const [leads, setLeads] = useState([]);
  const [quoteRequests, setQuoteRequests] = useState([]);

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") navigate("/");
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role !== "admin") return;
    loadAll();
  }, [currentUser]);

  const loadAll = async () => {
    setLoading(true);
    const [u, p, q, c, w, d, ct, mp, lb, ml, qr] = await Promise.all([
      base44.entities.User.list("-created_date", 500),
      base44.entities.CommunityPost.list("-created_date", 500),
      base44.entities.QuoteCheck.list("-created_date", 500),
      base44.entities.UsedCarCheck.list("-created_date", 500),
      base44.entities.Workshop.list("-created_date", 500),
      base44.entities.DirectoryClick.list("-created_date", 500),
      base44.entities.CreditTransaction.list("-created_date", 500),
      base44.entities.MechanicProfile.list("-created_date", 500),
      base44.entities.LogbookEntry.list("-created_date", 500),
      base44.entities.MechanicLead.list("-created_date", 500),
      base44.entities.QuoteRequest.list("-created_date", 500),
    ]);
    setUsers(u); setPosts(p); setQuotes(q); setCarChecks(c); setWorkshops(w); setDirClicks(d); setCreditTransactions(ct); setMechanicProfiles(mp); setLogbookEntries(lb); setLeads(ml); setQuoteRequests(qr);
    setLoading(false);
  };

  const filter = (arr, fields) =>
    arr.filter(item => fields.some(f => String(item[f] || "").toLowerCase().includes(search.toLowerCase())));

  const verdictBadge = (v) => {
    const map = { fair: "bg-emerald-100 text-emerald-700", high: "bg-amber-100 text-amber-700", ripoff: "bg-red-100 text-red-700", great_deal: "bg-emerald-100 text-emerald-700", overpriced: "bg-red-100 text-red-700" };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[v] || "bg-secondary text-muted-foreground"}`}>{v?.replace("_", " ") || "—"}</span>;
  };

  const topClicks = (() => {
    const counts = {};
    dirClicks.forEach(c => { const k = c.business_name; if (k) counts[k] = (counts[k] || 0) + 1; });
    return Object.entries(counts).map(([name, clicks]) => ({ name, clicks })).sort((a, b) => b.clicks - a.clicks).slice(0, 10);
  })();

  const totalCreditsIssued = creditTransactions.filter(t => ["add", "purchase"].includes(t.action)).reduce((s, t) => s + (t.amount || 0), 0);
  const totalCreditsUsed = creditTransactions.filter(t => t.action === "deduct").reduce((s, t) => s + (t.amount || 0), 0);
  const workshopViews = workshops.reduce((s, w) => s + (w.profile_views || 0), 0);
  const mobileMechanics = mechanicProfiles.filter(m => m.mechanic_type === "mobile_mechanic");
  const workshopMechanics = mechanicProfiles.filter(m => m.mechanic_type === "workshop");
  const mobileMechanicCredits = creditTransactions.filter(t => mechanicProfiles.some(m => m.user_email === t.user_email && m.mechanic_type === "mobile_mechanic")).reduce((s, t) => s + (t.amount || 0), 0);
  const workshopMechanicCredits = creditTransactions.filter(t => mechanicProfiles.some(m => m.user_email === t.user_email && m.mechanic_type === "workshop")).reduce((s, t) => s + (t.amount || 0), 0);

  if (!currentUser || currentUser.role !== "admin") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SEOHead title="Admin" description="Admin panel." path="/admin" noindex={true} />
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl">Founder Dashboard</h1>
            <p className="text-muted-foreground text-sm">Full platform analytics & management</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadAll} className="gap-2 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-1 flex-wrap bg-secondary rounded-xl p-1 mb-6 w-fit">
        {MAIN_TABS.map(t => {
          const pendingCount = t === "Verifications" ? mechanicProfiles.filter(p => p.verification_status === "pending").length : 0;
          return (
            <button key={t} onClick={() => { setMainTab(t); setSearch(""); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${mainTab === t ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t}
              {pendingCount > 0 && (
                <span className="h-4 w-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">{pendingCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {mainTab !== "Overview" && (
        <div className="relative mb-5 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 bg-secondary/50 border-0 text-sm" />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── OVERVIEW ── */}
          {mainTab === "Overview" && (
            <FounderOverview
              users={users}
              quotes={quotes}
              carChecks={carChecks}
              posts={posts}
              creditTransactions={creditTransactions}
              mechanicProfiles={mechanicProfiles}
              dirClicks={dirClicks}
              leads={leads}
              quoteRequests={quoteRequests}
              logbookEntries={logbookEntries}
              onNavigateTab={(t) => { setMainTab(t); setSearch(""); }}
            />
          )}

          {/* ── USERS & ANALYTICS ── */}
          {mainTab === "Users & Analytics" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-border pb-4 flex-wrap">
                {["Overview", "Directory", "Mechanics", "Signup IPs"].map(st => (
                  <button key={st} onClick={() => { setUsersSubTab(st); setSearch(""); }}
                    className={`px-3 py-2 text-sm font-semibold transition-colors border-b-2 ${usersSubTab === st ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {st}
                  </button>
                ))}
              </div>

              {usersSubTab === "Overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-card border border-border rounded-xl p-5">
                      <p className="text-xs text-muted-foreground font-medium uppercase mb-2">Total Users</p>
                      <p className="font-heading font-bold text-3xl">{users.length}</p>
                      <p className="text-xs text-muted-foreground mt-2">+{users.filter(u => u.created_date > subDays(new Date(),7).toISOString()).length} this week</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-5">
                      <p className="text-xs text-muted-foreground font-medium uppercase mb-2">Admin Users</p>
                      <p className="font-heading font-bold text-3xl">{users.filter(u => u.role === "admin").length}</p>
                      <p className="text-xs text-muted-foreground mt-2">platform administrators</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-5">
                      <p className="text-xs text-muted-foreground font-medium uppercase mb-2">Regular Users</p>
                      <p className="font-heading font-bold text-3xl">{users.filter(u => u.role === "user" || !u.role).length}</p>
                      <p className="text-xs text-muted-foreground mt-2">consumers using the app</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-5">
                      <p className="text-xs text-muted-foreground font-medium uppercase mb-2">Signup Rate</p>
                      <p className="font-heading font-bold text-3xl">{users.length > 0 ? (users.filter(u => u.created_date > subDays(new Date(),30).toISOString()).length / 30).toFixed(1) : 0}</p>
                      <p className="text-xs text-muted-foreground mt-2">per day (30d avg)</p>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-5">
                    <SectionTitle>User Signups (Last 14 Days)</SectionTitle>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={Array.from({ length: 14 }, (_, i) => {
                        const d = subDays(new Date(), 13 - i);
                        const dayStr = format(d, "yyyy-MM-dd");
                        return { date: format(d, "dd MMM"), Signups: users.filter(u => u.created_date?.startsWith(dayStr)).length };
                      })} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                        <defs>
                          <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0077cc" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#0077cc" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        <Area type="monotone" dataKey="Signups" stroke="#0077cc" fill="url(#gradUsers)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {usersSubTab === "Directory" && (
                <div className="bg-card border border-border rounded-xl overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">#</th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Name</th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Email</th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Role</th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Joined</th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filter(users, ["full_name", "email"]).map((u, i) => (
                        <tr key={u.id} className={i % 2 === 0 ? "" : "bg-secondary/20"}>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{i + 1}</td>
                          <td className="px-4 py-3 font-medium">{u.full_name || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            <a href={`mailto:${u.email}`} className="flex items-center gap-1 hover:text-accent transition-colors">
                              <Mail className="h-3 w-3" />{u.email}
                            </a>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "admin" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                              {u.role || "user"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{u.created_date ? format(new Date(u.created_date), "dd MMM yyyy") : "—"}</td>
                          <td className="px-4 py-3">
                            {u.role !== "admin" ? (
                              <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={async () => {
                                await base44.entities.User.update(u.id, { role: "admin" });
                                setUsers(users.map(x => x.id === u.id ? { ...x, role: "admin" } : x));
                                toast.success(`${u.full_name} promoted to admin.`);
                              }}>Make Admin</Button>
                            ) : u.email !== currentUser.email ? (
                              <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-destructive border-destructive/30" onClick={async () => {
                                await base44.entities.User.update(u.id, { role: "user" });
                                setUsers(users.map(x => x.id === u.id ? { ...x, role: "user" } : x));
                                toast.success(`${u.full_name} demoted.`);
                              }}>Remove Admin</Button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filter(users, ["full_name", "email"]).length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No users found.</p>}
                </div>
              )}

              {usersSubTab === "Mechanics" && (
                <div className="text-center py-20 text-muted-foreground">Mechanics data coming soon</div>
              )}

              {usersSubTab === "Signup IPs" && (
                <AdminSignupIPReview />
              )}


            </div>
          )}

          {/* ── DATA MANAGEMENT ── */}
          {mainTab === "Data Management" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-border pb-4 flex-wrap">
                {["Quotes", "Cars", "Community", "Credits", "Receipts"].map(st => (
                  <button key={st} onClick={() => { setDataSubTab(st); setSearch(""); }}
                    className={`px-3 py-2 text-sm font-semibold transition-colors border-b-2 ${dataSubTab === st ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {st}
                  </button>
                ))}
              </div>

              {dataSubTab === "Receipts" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-card border border-border rounded-xl p-5">
                      <p className="text-xs text-muted-foreground font-medium uppercase mb-2">Total Logbook Entries</p>
                      <p className="font-heading font-bold text-2xl">{logbookEntries.length}</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-5">
                      <p className="text-xs text-muted-foreground font-medium uppercase mb-2">Via Receipt Upload</p>
                      <p className="font-heading font-bold text-2xl text-emerald-600">{logbookEntries.filter(e => e.mechanic_name && e.mechanic_name !== "Unknown Workshop").length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Original images not stored — privacy by design</p>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-xl overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary">
                        <tr>
                          {["User", "Car", "Service", "Mechanic", "Date", "Cost", "Actions"].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filter(logbookEntries, ["car_make", "car_model", "service_type", "mechanic_name"]).map((e, i) => (
                          <tr key={e.id} className={i % 2 === 0 ? "" : "bg-secondary/20"}>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{e.created_by || "—"}</td>
                            <td className="px-4 py-3 font-medium whitespace-nowrap">{e.car_year} {e.car_make} {e.car_model}</td>
                            <td className="px-4 py-3 text-muted-foreground max-w-[140px] truncate">{e.service_type}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{e.mechanic_name || "—"}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{e.service_date || "—"}</td>
                            <td className="px-4 py-3 font-semibold">{e.cost ? `$${e.cost.toLocaleString()}` : "—"}</td>
                            <td className="px-4 py-3">
                              <button onClick={async () => { await base44.entities.LogbookEntry.delete(e.id); setLogbookEntries(logbookEntries.filter(x => x.id !== e.id)); toast.success("Deleted."); }} className="text-destructive hover:opacity-70">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {logbookEntries.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No logbook entries yet.</p>}
                  </div>
                </div>
              )}

              {dataSubTab === "Credits" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-card border border-border rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <p className="text-xs text-muted-foreground font-medium uppercase">Credits Issued</p>
                      </div>
                      <p className="font-heading font-bold text-2xl">{totalCreditsIssued}</p>
                      <p className="text-xs text-muted-foreground mt-1">{creditTransactions.filter(t => ["add", "purchase"].includes(t.action)).length} transactions</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <p className="text-xs text-muted-foreground font-medium uppercase">Credits Used</p>
                      </div>
                      <p className="font-heading font-bold text-2xl">{totalCreditsUsed}</p>
                      <p className="text-xs text-muted-foreground mt-1">{creditTransactions.filter(t => t.action === "deduct").length} checks</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <p className="text-xs text-muted-foreground font-medium uppercase">Refunds</p>
                      </div>
                      <p className="font-heading font-bold text-2xl">{creditTransactions.filter(t => t.action === "refund").reduce((s, t) => s + (t.amount || 0), 0)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{creditTransactions.filter(t => t.action === "refund").length} refunded</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <p className="text-xs text-muted-foreground font-medium uppercase">Balance</p>
                      </div>
                      <p className="font-heading font-bold text-2xl">{totalCreditsIssued - totalCreditsUsed}</p>
                      <p className="text-xs text-muted-foreground mt-1">net credits in circulation</p>
                    </div>
                  </div>
                  <AdminCreditsManager users={users} />
                </div>
              )}

              {dataSubTab === "Quotes" && (
                <div className="bg-card border border-border rounded-xl overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary">
                      <tr>
                        {["Car", "Service", "Quoted", "Fair Range", "BS Meter", "State", "Verdict", "Date", ""].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filter(quotes, ["car_make", "car_model", "service_type", "state"]).map((q, i) => (
                        <tr key={q.id} className={i % 2 === 0 ? "" : "bg-secondary/20"}>
                          <td className="px-4 py-3 font-medium whitespace-nowrap">{q.car_year} {q.car_make} {q.car_model}</td>
                          <td className="px-4 py-3 text-muted-foreground max-w-[140px] truncate">{q.service_type}</td>
                          <td className="px-4 py-3 font-semibold">${q.quoted_price?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                            {q.price_low && q.price_high ? `$${q.price_low?.toLocaleString()} – $${q.price_high?.toLocaleString()}` : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {q.bs_meter != null ? (
                              <span className={`font-bold text-sm ${q.bs_meter >= 7 ? "text-red-600" : q.bs_meter >= 4 ? "text-amber-600" : "text-emerald-600"}`}>{q.bs_meter}/10</span>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{q.state}</td>
                          <td className="px-4 py-3">{verdictBadge(q.verdict)}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{q.created_date ? format(new Date(q.created_date), "dd MMM yy") : "—"}</td>
                          <td className="px-4 py-3">
                            <button onClick={async () => { await base44.entities.QuoteCheck.delete(q.id); setQuotes(quotes.filter(x => x.id !== q.id)); toast.success("Deleted."); }} className="text-destructive hover:opacity-70">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filter(quotes, ["car_make", "car_model", "service_type", "state"]).length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No quote checks found.</p>}
                </div>
              )}

              {dataSubTab === "Cars" && (
                <div className="bg-card border border-border rounded-xl overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary">
                      <tr>
                        {["Car", "Odometer", "Asking", "Market Avg", "Score", "Verdict", "State", "Date", ""].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filter(carChecks, ["car_make", "car_model", "state"]).map((c, i) => (
                        <tr key={c.id} className={i % 2 === 0 ? "" : "bg-secondary/20"}>
                          <td className="px-4 py-3 font-medium whitespace-nowrap">{c.car_year} {c.car_make} {c.car_model}</td>
                          <td className="px-4 py-3 text-muted-foreground">{c.odometer?.toLocaleString()} km</td>
                          <td className="px-4 py-3 font-semibold">${c.asking_price?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-muted-foreground">${c.market_price_average?.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${c.overall_score >= 7 ? "text-emerald-600" : c.overall_score >= 5 ? "text-amber-600" : "text-red-600"}`}>{c.overall_score}/10</span>
                          </td>
                          <td className="px-4 py-3">{verdictBadge(c.price_verdict)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{c.state}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{c.created_date ? format(new Date(c.created_date), "dd MMM yy") : "—"}</td>
                          <td className="px-4 py-3">
                            <button onClick={async () => { await base44.entities.UsedCarCheck.delete(c.id); setCarChecks(carChecks.filter(x => x.id !== c.id)); toast.success("Deleted."); }} className="text-destructive hover:opacity-70">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filter(carChecks, ["car_make", "car_model", "state"]).length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No car checks found.</p>}
                </div>
              )}

              {dataSubTab === "Community" && (
                <div className="space-y-3">
                  <AdminHeldPosts />
                  {filter(posts, ["mechanic_name", "service_type", "suburb", "state"]).map(post => (
                    <div key={post.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{post.mechanic_name || "Unknown"} — {post.service_type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${post.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{post.status || "pending"}</span>
                          {post.is_verified && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">Verified</span>}
                        </div>
                        <div className="text-muted-foreground text-xs mt-1">{post.car_year} {post.car_make} {post.car_model} · {post.suburb}, {post.state} · ${post.price_paid?.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{post.created_date ? format(new Date(post.created_date), "dd MMM yyyy") : "—"}</div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {post.status !== "approved" && (
                          <button onClick={async () => { await base44.entities.CommunityPost.update(post.id, { status: "approved" }); setPosts(posts.map(p => p.id === post.id ? { ...p, status: "approved" } : p)); toast.success("Approved."); }} className="text-emerald-600 hover:opacity-70">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={async () => { await base44.entities.CommunityPost.delete(post.id); setPosts(posts.filter(p => p.id !== post.id)); toast.success("Deleted."); }} className="text-destructive hover:opacity-70">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {filter(posts, ["mechanic_name", "service_type", "suburb", "state"]).length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No posts found.</p>}
                </div>
              )}
            </div>
          )}

          {/* ── WORKSPACE ── */}
          {mainTab === "Workspace" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-border pb-4 flex-wrap">
                {["Workshops", "Directory Clicks"].map(st => (
                  <button key={st} onClick={() => { setWorkspaceSubTab(st); setSearch(""); }}
                    className={`px-3 py-2 text-sm font-semibold transition-colors border-b-2 ${workspaceSubTab === st ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {st}
                  </button>
                ))}
              </div>

              {workspaceSubTab === "Workshops" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard label="Total Workshops" value={workshopMechanics.length} icon={Wrench} color="bg-blue-500" sub={`${workshopMechanics.filter(m => m.is_active).length} active`} />
                    <StatCard label="Featured" value={workshopMechanics.filter(m => m.subscription_tier === "featured").length} icon={Activity} color="bg-amber-500" />
                    <StatCard label="States Covered" value={new Set(workshopMechanics.map(m => m.state)).size} icon={Map} color="bg-purple-500" />
                    <StatCard label="Free Leads Used" value={workshopMechanics.reduce((s, m) => s + (m.free_leads_used || 0), 0)} icon={TrendingUp} color="bg-emerald-500" sub="this month" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-xl p-5">
                      <SectionTitle>Workshops by State</SectionTitle>
                      {(() => {
                        const counts = {};
                        workshopMechanics.forEach(m => { if (m.state) counts[m.state] = (counts[m.state] || 0) + 1; });
                        const data = Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
                        return data.length > 0 ? (
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                              <Bar dataKey="value" fill="#0077cc" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : <p className="text-muted-foreground text-sm text-center py-6">No data yet.</p>
                      })()}
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5">
                      <SectionTitle>Subscription Breakdown</SectionTitle>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Featured</span>
                          <span className="font-bold text-amber-600">{workshopMechanics.filter(m => m.subscription_tier === "featured").length}</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{width: `${(workshopMechanics.filter(m => m.subscription_tier === "featured").length / Math.max(workshopMechanics.length, 1)) * 100}%`}} /></div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Starter</span>
                          <span className="font-bold text-blue-600">{workshopMechanics.filter(m => m.subscription_tier === "starter").length}</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{width: `${(workshopMechanics.filter(m => m.subscription_tier === "starter").length / Math.max(workshopMechanics.length, 1)) * 100}%`}} /></div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Free</span>
                          <span className="font-bold text-slate-600">{workshopMechanics.filter(m => m.subscription_tier === "free").length}</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-slate-500" style={{width: `${(workshopMechanics.filter(m => m.subscription_tier === "free").length / Math.max(workshopMechanics.length, 1)) * 100}%`}} /></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary">
                        <tr>
                          {["Business Name", "ABN", "Location", "Phone", "Tier", "Status", "Specialties", "Actions"].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filter(workshopMechanics, ["business_name", "suburb", "state"]).map((m, i) => (
                          <tr key={m.id} className={i % 2 === 0 ? "" : "bg-secondary/20"}>
                            <td className="px-4 py-3 font-medium">{m.business_name}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{m.abn}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{m.suburb}, {m.state}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{m.phone}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.subscription_tier === "featured" ? "bg-amber-100 text-amber-700" : m.subscription_tier === "starter" ? "bg-blue-100 text-blue-700" : "bg-secondary text-muted-foreground"}`}>
                                {m.subscription_tier === "featured" ? "Featured" : m.subscription_tier === "starter" ? "Starter" : "Free"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                {m.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs max-w-[150px] truncate">{m.specialties?.join(", ") || "—"}</td>
                            <td className="px-4 py-3 flex gap-2">
                              {m.subscription_tier !== "featured" ? (
                                <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={async () => {
                                  await base44.entities.MechanicProfile.update(m.id, { subscription_tier: "featured" });
                                  setMechanicProfiles(mechanicProfiles.map(x => x.id === m.id ? { ...x, subscription_tier: "featured" } : x));
                                  toast.success("Upgraded to Featured");
                                }}>Upgrade</Button>
                              ) : null}
                              <button onClick={async () => { await base44.entities.MechanicProfile.delete(m.id); setMechanicProfiles(mechanicProfiles.filter(x => x.id !== m.id)); toast.success("Removed."); }} className="text-destructive hover:opacity-70">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filter(workshopMechanics, ["business_name", "suburb", "state"]).length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No workshops found.</p>}
                  </div>
                </div>
              )}

              {workspaceSubTab === "Directory Clicks" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-xl p-5">
                      <SectionTitle>Top Clicked Mechanics</SectionTitle>
                      <div className="space-y-2">
                        {topClicks.length > 0 ? topClicks.map((c, i) => (
                          <div key={c.name} className="flex items-center gap-3">
                            <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                            <span className="flex-1 text-sm font-medium truncate">{c.name}</span>
                            <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">{c.clicks}</span>
                          </div>
                        )) : <p className="text-muted-foreground text-sm text-center py-6">No clicks recorded yet.</p>}
                      </div>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-5">
                      <SectionTitle>Click Activity (14 days)</SectionTitle>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={Array.from({ length: 14 }, (_, i) => {
                          const d = subDays(new Date(), 13 - i);
                          const dayStr = format(d, "yyyy-MM-dd");
                          return { date: format(d, "dd MMM"), Clicks: dirClicks.filter(c => c.created_date?.startsWith(dayStr)).length };
                        })} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          <Bar dataKey="Clicks" fill="#0077cc" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-xl overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary">
                        <tr>
                          {["Business", "Suburb", "State", "Maps URL", "Date"].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filter(dirClicks, ["business_name", "suburb", "state"]).map((c, i) => (
                          <tr key={c.id} className={i % 2 === 0 ? "" : "bg-secondary/20"}>
                            <td className="px-4 py-3 font-medium">{c.business_name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{c.suburb || "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground">{c.state || "—"}</td>
                            <td className="px-4 py-3">
                              {c.maps_url ? <a href={c.maps_url} target="_blank" rel="noreferrer" className="text-accent hover:underline text-xs flex items-center gap-1"><Map className="h-3 w-3" />View</a> : "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{c.created_date ? format(new Date(c.created_date), "dd MMM yy, h:mm a") : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filter(dirClicks, ["business_name", "suburb", "state"]).length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No clicks recorded yet.</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── VERIFICATIONS ── */}
          {mainTab === "Verifications" && (
            <MechanicVerificationQueue />
          )}

          {/* ── WAITLIST ── */}
          {mainTab === "Waitlist" && (
            <AdminSuburbWaitlist />
          )}

          {/* ── REFUNDS ── */}
          {mainTab === "Refunds" && (() => {
            const purchaseTxs = filter(creditTransactions.filter(t => t.action === "purchase" && t.stripe_payment_intent_id), ["user_email", "stripe_payment_intent_id", "stripe_session_id"]);
            const handleRefund = async (tx) => {
              const reason = refundReason[tx.id] || "Admin-initiated refund";
              setRefundingId(tx.id);
              try {
                const res = await base44.functions.invoke("stripeRefund", { transaction_id: tx.id, reason });
                if (res.data?.success) {
                  toast.success(`Refunded $${res.data.amount_refunded_aud} — Stripe ID: ${res.data.refund_id}`);
                  setCreditTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, stripe_refund_id: res.data.refund_id } : t));
                } else {
                  toast.error(res.data?.error || "Refund failed");
                }
              } catch (err) {
                toast.error(err.message || "Refund failed");
              } finally {
                setRefundingId(null);
              }
            };

            return (
              <div className="space-y-6">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 text-sm">Stripe Refunds</p>
                    <p className="text-xs text-amber-700 mt-0.5">Only purchases made after the payment intent tracking update will appear here. Older purchases must be refunded manually via the Stripe dashboard.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-card border border-border rounded-xl p-5">
                    <p className="text-xs text-muted-foreground font-medium uppercase mb-2">Refundable Purchases</p>
                    <p className="font-heading font-bold text-2xl">{purchaseTxs.filter(t => !t.stripe_refund_id).length}</p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-5">
                    <p className="text-xs text-muted-foreground font-medium uppercase mb-2">Already Refunded</p>
                    <p className="font-heading font-bold text-2xl">{purchaseTxs.filter(t => t.stripe_refund_id).length}</p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-5">
                    <p className="text-xs text-muted-foreground font-medium uppercase mb-2">Total Refunded (AUD)</p>
                    <p className="font-heading font-bold text-2xl">${creditTransactions.filter(t => t.action === "refund" && t.amount_paid_aud).reduce((s, t) => s + (t.amount_paid_aud || 0), 0).toFixed(2)}</p>
                  </div>
                </div>

                {purchaseTxs.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <RotateCcw className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold">No refundable purchases found.</p>
                    <p className="text-sm mt-1">Purchases will appear here once payment intent tracking is active.</p>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-xl overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary">
                        <tr>
                          {["User", "Credits", "Amount (AUD)", "Payment Intent", "Date", "Reason", "Action"].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseTxs.map((tx, i) => (
                          <tr key={tx.id} className={i % 2 === 0 ? "" : "bg-secondary/20"}>
                            <td className="px-4 py-3 text-xs">{tx.user_email}</td>
                            <td className="px-4 py-3 font-semibold">{tx.amount}</td>
                            <td className="px-4 py-3">{tx.amount_paid_aud ? `$${tx.amount_paid_aud}` : "—"}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{tx.stripe_payment_intent_id?.slice(0, 20)}…</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{tx.created_date ? format(new Date(tx.created_date), "dd MMM yy") : "—"}</td>
                            <td className="px-4 py-3">
                              {tx.stripe_refund_id ? (
                                <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">Refunded</span>
                              ) : (
                                <Input
                                  placeholder="Reason..."
                                  value={refundReason[tx.id] || ""}
                                  onChange={e => setRefundReason(prev => ({ ...prev, [tx.id]: e.target.value }))}
                                  className="h-8 text-xs w-36 bg-secondary/50 border-0"
                                />
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {tx.stripe_refund_id ? (
                                <span className="text-xs text-emerald-600 font-mono">{tx.stripe_refund_id?.slice(0, 14)}…</span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2 text-destructive border-destructive/30 hover:bg-destructive/5 gap-1"
                                  disabled={refundingId === tx.id}
                                  onClick={() => handleRefund(tx)}
                                >
                                  {refundingId === tx.id ? (
                                    <><span className="w-3 h-3 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" /> Refunding…</>
                                  ) : (
                                    <><RotateCcw className="h-3 w-3" /> Refund</>
                                  )}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── B2B ── */}
          {mainTab === "B2B" && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-border pb-4 flex-wrap">
                {["Mobile Mechanics", "Workshops"].map(st => (
                  <button key={st} onClick={() => { setB2bSubTab(st); setSearch(""); }}
                    className={`px-3 py-2 text-sm font-semibold transition-colors border-b-2 ${b2bSubTab === st ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {st}
                  </button>
                ))}
              </div>

              {b2bSubTab === "Mobile Mechanics" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <StatCard label="Active Mechanics" value={mobileMechanics.filter(m => m.is_active).length} icon={Wrench} color="bg-blue-500" sub={`of ${mobileMechanics.length}`} />
                    <StatCard label="Credits Issued" value={mobileMechanicCredits} icon={TrendingUp} color="bg-emerald-500" />
                    <StatCard label="Featured" value={mobileMechanics.filter(m => m.subscription_tier === "featured").length} icon={Activity} color="bg-amber-500" />
                    <StatCard label="Free Listings" value={mobileMechanics.filter(m => m.subscription_tier === "free").length} icon={Users} color="bg-slate-500" />
                    <StatCard label="States Covered" value={new Set(mobileMechanics.map(m => m.state)).size} icon={Map} color="bg-purple-500" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-xl p-5">
                      <SectionTitle>Credits Usage (14 Days)</SectionTitle>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={Array.from({ length: 14 }, (_, i) => {
                          const d = subDays(new Date(), 13 - i);
                          const dayStr = format(d, "yyyy-MM-dd");
                          return {
                            date: format(d, "dd MMM"),
                            Used: creditTransactions.filter(t => t.created_date?.startsWith(dayStr) && t.action === "deduct" && mechanicProfiles.some(m => m.user_email === t.user_email && m.mechanic_type === "mobile_mechanic")).reduce((s, t) => s + (t.amount || 0), 0)
                          };
                        })} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          <Bar dataKey="Used" fill="#0077cc" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5">
                      <SectionTitle>Subscription Tier Distribution</SectionTitle>
                      {(() => {
                        const featured = mobileMechanics.filter(m => m.subscription_tier === "featured").length;
                        const free = mobileMechanics.filter(m => m.subscription_tier === "free").length;
                        const data = [];
                        if (featured > 0) data.push({ name: "Featured", value: featured });
                        if (free > 0) data.push({ name: "Free", value: free });
                        return data.length > 0 ? (
                          <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                              <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                                {data.map((_, i) => <Cell key={i} fill={["#f59e0b", "#6b7280"][i]} />)}
                              </Pie>
                              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : <p className="text-muted-foreground text-sm text-center py-6">No data yet.</p>
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-xl p-5">
                      <SectionTitle>Mechanics by State</SectionTitle>
                      {(() => {
                        const counts = {};
                        mobileMechanics.forEach(m => { if (m.state) counts[m.state] = (counts[m.state] || 0) + 1; });
                        const data = Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
                        return data.length > 0 ? (
                          <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                              <Bar dataKey="value" fill="#0077cc" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : <p className="text-muted-foreground text-sm text-center py-6">No data yet.</p>
                      })()}
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5">
                      <SectionTitle>Activity Metrics</SectionTitle>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Avg Credits per Mechanic</span>
                          <span className="font-bold">{mobileMechanics.length > 0 ? (mobileMechanicCredits / mobileMechanics.length).toFixed(1) : 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Active Rate</span>
                          <span className="font-bold">{mobileMechanics.length > 0 ? ((mobileMechanics.filter(m => m.is_active).length / mobileMechanics.length) * 100).toFixed(0) : 0}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Free Leads Used (30d)</span>
                          <span className="font-bold">{mobileMechanics.reduce((s, m) => s + (m.free_leads_used || 0), 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Avg Specialties</span>
                          <span className="font-bold">{mobileMechanics.length > 0 ? (mobileMechanics.reduce((s, m) => s + (m.specialties?.length || 0), 0) / mobileMechanics.length).toFixed(1) : 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary">
                        <tr>
                          {["Business Name", "ABN", "Location", "Phone", "Tier", "Status", "Specialties", "Actions"].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filter(mobileMechanics, ["business_name", "suburb", "state"]).map((m, i) => (
                          <tr key={m.id} className={i % 2 === 0 ? "" : "bg-secondary/20"}>
                            <td className="px-4 py-3 font-medium">{m.business_name}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{m.abn}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{m.suburb}, {m.state}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{m.phone}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.subscription_tier === "featured" ? "bg-amber-100 text-amber-700" : "bg-secondary text-muted-foreground"}`}>
                                {m.subscription_tier === "featured" ? "Featured" : "Free"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                {m.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs max-w-[150px] truncate">{m.specialties?.join(", ") || "—"}</td>
                            <td className="px-4 py-3 flex gap-2">
                              {m.subscription_tier !== "featured" ? (
                                <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={async () => {
                                  await base44.entities.MechanicProfile.update(m.id, { subscription_tier: "featured" });
                                  setMechanicProfiles(mechanicProfiles.map(x => x.id === m.id ? { ...x, subscription_tier: "featured" } : x));
                                  toast.success("Upgraded to Featured");
                                }}>Upgrade</Button>
                              ) : null}
                              <button onClick={async () => { await base44.entities.MechanicProfile.delete(m.id); setMechanicProfiles(mechanicProfiles.filter(x => x.id !== m.id)); toast.success("Removed."); }} className="text-destructive hover:opacity-70">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filter(mobileMechanics, ["business_name", "suburb", "state"]).length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No mobile mechanics found.</p>}
                  </div>
                </div>
              )}

              {b2bSubTab === "Workshops" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <StatCard label="Active Workshops" value={workshopMechanics.filter(m => m.is_active).length} icon={Wrench} color="bg-blue-500" sub={`of ${workshopMechanics.length}`} />
                    <StatCard label="Credits Issued" value={workshopMechanicCredits} icon={TrendingUp} color="bg-emerald-500" />
                    <StatCard label="Featured" value={workshopMechanics.filter(m => m.subscription_tier === "featured").length} icon={Activity} color="bg-amber-500" />
                    <StatCard label="Total Views" value={workshopMechanics.reduce((s, m) => s + (m.profile_views || 0), 0)} icon={BarChart2} color="bg-indigo-500" />
                    <StatCard label="Avg Views/Shop" value={(workshopMechanics.reduce((s, m) => s + (m.profile_views || 0), 0) / Math.max(workshopMechanics.length, 1)).toFixed(0)} icon={TrendingUp} color="bg-pink-500" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-xl p-5">
                      <SectionTitle>Credits & Views (14 Days)</SectionTitle>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={Array.from({ length: 14 }, (_, i) => {
                          const d = subDays(new Date(), 13 - i);
                          const dayStr = format(d, "yyyy-MM-dd");
                          return {
                            date: format(d, "dd MMM"),
                            Credits: creditTransactions.filter(t => t.created_date?.startsWith(dayStr) && ["add", "purchase"].includes(t.action) && mechanicProfiles.some(m => m.user_email === t.user_email && m.mechanic_type === "workshop")).reduce((s, t) => s + (t.amount || 0), 0),
                            Views: workshopMechanics.filter(m => m.created_date?.startsWith(dayStr)).reduce((s, m) => s + (m.profile_views || 0), 0)
                          };
                        })} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Credits" fill="#22c55e" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Views" fill="#0077cc" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5">
                      <SectionTitle>Subscription & Performance</SectionTitle>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Featured Rate</span>
                          <span className="font-bold text-amber-600">{workshopMechanics.length > 0 ? ((workshopMechanics.filter(m => m.subscription_tier === "featured").length / workshopMechanics.length) * 100).toFixed(0) : 0}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{width: `${workshopMechanics.length > 0 ? ((workshopMechanics.filter(m => m.subscription_tier === "featured").length / workshopMechanics.length) * 100) : 0}%`}} /></div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Active Rate</span>
                          <span className="font-bold text-emerald-600">{workshopMechanics.length > 0 ? ((workshopMechanics.filter(m => m.is_active).length / workshopMechanics.length) * 100).toFixed(0) : 0}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{width: `${workshopMechanics.length > 0 ? ((workshopMechanics.filter(m => m.is_active).length / workshopMechanics.length) * 100) : 0}%`}} /></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-xl p-5">
                      <SectionTitle>Workshops by State</SectionTitle>
                      {(() => {
                        const counts = {};
                        workshopMechanics.forEach(m => { if (m.state) counts[m.state] = (counts[m.state] || 0) + 1; });
                        const data = Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
                        return data.length > 0 ? (
                          <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                              <Bar dataKey="value" fill="#0077cc" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : <p className="text-muted-foreground text-sm text-center py-6">No data yet.</p>
                      })()}
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5">
                      <SectionTitle>Key Metrics</SectionTitle>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Avg Credits per Workshop</span>
                          <span className="font-bold">{workshopMechanics.length > 0 ? (workshopMechanicCredits / workshopMechanics.length).toFixed(1) : 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Avg Views per Workshop</span>
                          <span className="font-bold">{workshopMechanics.length > 0 ? (workshopMechanics.reduce((s, m) => s + (m.profile_views || 0), 0) / workshopMechanics.length).toFixed(1) : 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Specialties</span>
                          <span className="font-bold">{workshopMechanics.reduce((s, m) => s + (m.specialties?.length || 0), 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Free Leads (30d)</span>
                          <span className="font-bold">{workshopMechanics.reduce((s, m) => s + (m.free_leads_used || 0), 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-5">
                    <SectionTitle>Top Performing Workshops</SectionTitle>
                    {(() => {
                      const sorted = [...workshopMechanics].sort((a, b) => (b.profile_views || 0) - (a.profile_views || 0)).slice(0, 8);
                      return sorted.length > 0 ? (
                        <div className="space-y-2">
                          {sorted.map((m, i) => (
                            <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30">
                              <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{m.business_name}</p>
                                <p className="text-xs text-muted-foreground">{m.suburb}, {m.state}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-xs font-bold text-accent">{m.profile_views || 0} views</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.subscription_tier === "featured" ? "bg-amber-100 text-amber-700" : "bg-secondary text-muted-foreground"}`}>{m.subscription_tier === "featured" ? "Featured" : "Free"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-muted-foreground text-sm text-center py-6">No workshops yet.</p>
                    })()}
                  </div>

                  <div className="bg-card border border-border rounded-xl overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary">
                        <tr>
                          {["Business Name", "ABN", "Location", "Phone", "Tier", "Status", "Views", "Actions"].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filter(workshopMechanics, ["business_name", "suburb", "state"]).map((m, i) => (
                          <tr key={m.id} className={i % 2 === 0 ? "" : "bg-secondary/20"}>
                            <td className="px-4 py-3 font-medium">{m.business_name}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{m.abn}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{m.suburb}, {m.state}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{m.phone}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.subscription_tier === "featured" ? "bg-amber-100 text-amber-700" : "bg-secondary text-muted-foreground"}`}>
                                {m.subscription_tier === "featured" ? "Featured" : "Free"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                {m.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs font-medium">{m.profile_views || 0}</td>
                            <td className="px-4 py-3 flex gap-2">
                              {m.subscription_tier !== "featured" ? (
                                <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={async () => {
                                  await base44.entities.MechanicProfile.update(m.id, { subscription_tier: "featured" });
                                  setMechanicProfiles(mechanicProfiles.map(x => x.id === m.id ? { ...x, subscription_tier: "featured" } : x));
                                  toast.success("Upgraded to Featured");
                                }}>Upgrade</Button>
                              ) : null}
                              <button onClick={async () => { await base44.entities.MechanicProfile.delete(m.id); setMechanicProfiles(mechanicProfiles.filter(x => x.id !== m.id)); toast.success("Removed."); }} className="text-destructive hover:opacity-70">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filter(workshopMechanics, ["business_name", "suburb", "state"]).length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No workshops found.</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}