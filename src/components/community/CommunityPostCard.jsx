import { motion } from "framer-motion";
import { BadgeCheck, MapPin } from "lucide-react";
import moment from "moment";

export default function CommunityPostCard({ post, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all hover:border-accent/40 hover:shadow-[0_8px_24px_-8px_rgba(16,24,40,0.16)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-heading text-base font-bold text-foreground">
              {post.car_year} {post.car_make} {post.car_model}
            </h3>
            {post.is_verified && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <BadgeCheck className="h-3 w-3" /> Verified
              </span>
            )}
          </div>

          <p className="mt-1.5 text-sm font-semibold text-foreground/80">{post.service_type}</p>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {post.suburb}, {post.state}
            </span>
            <span className="text-border">•</span>
            <span className="truncate">{post.mechanic_name || "Undisclosed workshop"}</span>
            <span className="text-border">•</span>
            <span>{moment(post.created_date).fromNow()}</span>
          </div>
        </div>

        <div className="shrink-0 rounded-xl bg-secondary/60 px-3.5 py-2.5 text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Paid</p>
          <p className="font-heading text-2xl font-black leading-tight text-primary">
            ${post.price_paid?.toLocaleString()}
          </p>
        </div>
      </div>
    </motion.div>
  );
}