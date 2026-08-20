import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Minus, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function AdminCreditsManager({ users }) {
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [credits, setCredits] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState("add");

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
    (u.full_name && u.full_name.toLowerCase().includes(searchEmail.toLowerCase()))
  );

  const handleRefund = async () => {
    if (!selectedUser || !credits || !reason) {
      toast.error("Please fill in all fields");
      return;
    }

    const creditAmount = parseInt(credits);
    if (isNaN(creditAmount) || creditAmount <= 0) {
      toast.error("Credits must be a positive number");
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke("refundUserCredits", {
        user_email: selectedUser.email,
        credits: creditAmount,
        reason,
        action,
      });

      toast.success(`${creditAmount} credits ${action === "add" ? "added to" : "deducted from"} ${selectedUser.full_name}`);
      setSelectedUser(null);
      setCredits("");
      setReason("");
      setAction("add");
    } catch (err) {
      toast.error("Failed to process credit adjustment");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Search and select user */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-muted-foreground">Find User</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name…"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="pl-9 h-10 bg-secondary/50 border-0 text-sm"
            />
          </div>

          {searchEmail && (
            <div className="border border-border rounded-xl max-h-48 overflow-y-auto">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelectedUser(u);
                      setSearchEmail("");
                    }}
                    className={`w-full text-left px-4 py-2.5 border-b border-border last:border-0 hover:bg-secondary transition-colors ${
                      selectedUser?.id === u.id ? "bg-accent/10" : ""
                    }`}
                  >
                    <p className="text-sm font-medium">{u.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </button>
                ))
              ) : (
                <p className="text-xs text-muted-foreground px-4 py-3 text-center">No users found</p>
              )}
            </div>
          )}

          {selectedUser && (
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Selected</p>
              <p className="text-sm font-medium">{selectedUser.full_name}</p>
              <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
            </div>
          )}
        </div>

        {/* Adjustment form */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-muted-foreground">Adjust Credits</label>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Action</label>
            <div className="flex gap-2">
              <button
                onClick={() => setAction("add")}
                className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border-2 transition-all text-sm font-medium ${
                  action === "add"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-border bg-secondary/50 text-muted-foreground"
                }`}
              >
                <Plus className="h-4 w-4" /> Add
              </button>
              <button
                onClick={() => setAction("deduct")}
                className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border-2 transition-all text-sm font-medium ${
                  action === "deduct"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-border bg-secondary/50 text-muted-foreground"
                }`}
              >
                <Minus className="h-4 w-4" /> Deduct
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Number of Credits</label>
            <Input
              type="number"
              min="1"
              placeholder="e.g. 10"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              className="h-10 bg-secondary/50 border-0 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Reason</label>
            <Input
              placeholder="e.g. Bug compensation, request"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-10 bg-secondary/50 border-0 text-sm"
            />
          </div>
        </div>

        {/* Summary & action */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-muted-foreground">Summary</label>

          {selectedUser ? (
            <div className="bg-card border-2 border-border rounded-xl p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">User</p>
                <p className="text-sm font-semibold">{selectedUser.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Action</p>
                <p className={`text-sm font-semibold flex items-center gap-1 ${
                  action === "add" ? "text-emerald-600" : "text-red-600"
                }`}>
                  {action === "add" ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                  {action === "add" ? "Add" : "Deduct"} {credits || "—"} credits
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Reason</p>
                <p className="text-sm font-semibold">{reason || "—"}</p>
              </div>

              <Button
                onClick={handleRefund}
                disabled={!selectedUser || !credits || !reason || loading}
                className={`w-full h-10 font-semibold gap-2 ${
                  action === "add"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                  </>
                ) : (
                  `${action === "add" ? "Add" : "Deduct"} Credits`
                )}
              </Button>
            </div>
          ) : (
            <div className="bg-secondary/30 border border-border rounded-xl p-4 text-center py-8">
              <p className="text-sm text-muted-foreground">Select a user to proceed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}