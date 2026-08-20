import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MapPin, Users } from "lucide-react";
import { format } from "date-fns";

export default function AdminSuburbWaitlist() {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["admin-suburb-waitlist"],
    queryFn: () => base44.entities.SuburbWaitlist.list("-created_date", 1000),
  });

  // Rank suburbs by waitlist count
  const ranked = (() => {
    const groups = {};
    entries.forEach((e) => {
      const key = `${e.suburb}|${e.state}`;
      if (!groups[key]) groups[key] = { suburb: e.suburb, state: e.state, count: 0, latest: e.created_date };
      groups[key].count++;
      if (e.created_date > groups[key].latest) groups[key].latest = e.created_date;
    });
    return Object.values(groups).sort((a, b) => b.count - a.count);
  })();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase mb-2">Total Waitlist Signups</p>
          <p className="font-heading font-bold text-3xl">{entries.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase mb-2">Suburbs Requested</p>
          <p className="font-heading font-bold text-3xl">{ranked.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase mb-2">Top Suburb</p>
          <p className="font-heading font-bold text-xl truncate">
            {ranked[0] ? `${ranked[0].suburb}, ${ranked[0].state}` : "—"}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-heading font-bold text-base text-foreground mb-3">Suburbs Ranked by Demand</h2>
        {ranked.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-10">No waitlist signups yet.</p>
        ) : (
          <div className="space-y-2">
            {ranked.map((r, i) => (
              <div key={`${r.suburb}-${r.state}`} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium truncate">{r.suburb}, {r.state}</span>
                    <span className="text-muted-foreground ml-2 flex-shrink-0 flex items-center gap-1">
                      <Users className="h-3 w-3" /> {r.count} waiting
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${(r.count / ranked[0].count) * 100}%` }} />
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground flex-shrink-0 hidden sm:block">
                  last: {format(new Date(r.latest), "dd MMM yy")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              {["Suburb", "State", "User Email", "Joined"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.id} className={i % 2 === 0 ? "" : "bg-secondary/20"}>
                <td className="px-4 py-3 font-medium">{e.suburb}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.state}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{e.user_email}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                  {e.created_date ? format(new Date(e.created_date), "dd MMM yyyy, h:mm a") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No entries yet.</p>}
      </div>
    </div>
  );
}