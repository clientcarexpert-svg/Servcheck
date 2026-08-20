import { Database, BadgeCheck, TrendingUp } from "lucide-react";

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="font-heading text-lg font-black leading-none text-foreground">{value}</p>
        <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

export default function CommunityStats({ posts, state }) {
  const count = posts.length;
  const verifiedPosts = posts.filter((p) => p.is_verified);
  const verified = verifiedPosts.length;
  const avg = verified
    ? Math.round(verifiedPosts.reduce((sum, p) => sum + (p.price_paid || 0), 0) / verified)
    : 0;

  return (
    <div className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <Stat icon={Database} label={`Prices in ${state}`} value={count} />
      <Stat icon={TrendingUp} label="Avg paid (verified)" value={avg ? `$${avg.toLocaleString()}` : "—"} />
      <Stat icon={BadgeCheck} label="Receipt verified" value={verified} />
    </div>
  );
}