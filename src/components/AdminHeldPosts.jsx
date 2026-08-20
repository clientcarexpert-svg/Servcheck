import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CheckCircle, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminHeldPosts() {
  const [held, setHeld] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.CommunityPost.filter({ status: "held_for_review" }, "-created_date", 100)
      .then(setHeld)
      .finally(() => setLoading(false));
  }, []);

  const approve = async (post) => {
    await base44.entities.CommunityPost.update(post.id, { status: "approved" });
    setHeld(held.filter(p => p.id !== post.id));
    toast.success("Post approved and published.");
  };

  const remove = async (post) => {
    await base44.entities.CommunityPost.delete(post.id);
    setHeld(held.filter(p => p.id !== post.id));
    toast.success("Post removed.");
  };

  if (loading) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <p className="font-semibold text-sm text-amber-900">Held for Review ({held.length})</p>
      </div>
      {held.length === 0 ? (
        <p className="text-xs text-muted-foreground">No posts awaiting review. Flagged posts are held here — nothing is removed without an admin decision.</p>
      ) : (
        <div className="space-y-2">
          {held.map(post => (
            <div key={post.id} className="bg-card border border-border rounded-lg px-4 py-3 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{post.mechanic_name || "Unknown"} — {post.service_type}</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {post.car_year} {post.car_make} {post.car_model} · {post.suburb}, {post.state} · ${post.price_paid?.toLocaleString()}
                  {post.created_date ? ` · ${format(new Date(post.created_date), "dd MMM yyyy")}` : ""}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-emerald-600 border-emerald-300 gap-1" onClick={() => approve(post)}>
                  <CheckCircle className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-destructive border-destructive/30 gap-1" onClick={() => remove(post)}>
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}