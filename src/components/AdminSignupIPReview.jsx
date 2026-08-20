import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Globe } from "lucide-react";
import { format } from "date-fns";

const DAY_MS = 24 * 60 * 60 * 1000;

export default function AdminSignupIPReview() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-signup-logs"],
    queryFn: () => base44.entities.SignupLog.list("-created_date", 1000),
  });

  // Group by IP and flag IPs with 2+ signups within 24 hours of each other
  const flagged = (() => {
    const byIp = {};
    logs.forEach((l) => {
      if (!l.ip_address || l.ip_address === "unknown") return;
      (byIp[l.ip_address] = byIp[l.ip_address] || []).push(l);
    });
    return Object.entries(byIp)
      .map(([ip, entries]) => {
        const sorted = [...entries].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        const within24h = sorted.some(
          (e, i) => i > 0 && new Date(e.created_date) - new Date(sorted[i - 1].created_date) <= DAY_MS
        );
        return { ip, entries: sorted, within24h };
      })
      .filter((g) => g.entries.length >= 2 && g.within24h)
      .sort((a, b) => b.entries.length - a.entries.length);
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
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900 text-sm">Shared-IP Signups (review only)</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Accounts below verified their email from the same IP address within 24 hours of each other.
            They are NOT blocked automatically — review and act manually if needed.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase mb-2">Total Verified Signups</p>
          <p className="font-heading font-bold text-3xl">{logs.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase mb-2">Flagged IPs</p>
          <p className="font-heading font-bold text-3xl">{flagged.length}</p>
        </div>
      </div>

      {flagged.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Globe className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="font-semibold">No shared-IP signups detected.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {flagged.map((g) => (
            <div key={g.ip} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm font-bold">{g.ip}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                  {g.entries.length} signups
                </span>
              </div>
              <div className="space-y-1.5">
                {g.entries.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{e.user_email}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {format(new Date(e.created_date), "dd MMM yyyy, h:mm a")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}