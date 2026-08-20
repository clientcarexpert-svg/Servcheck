import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestNotificationPermission } from "@/lib/notifications";

export default function NotificationPermissionModal({ onDone }) {
  const handleAllow = async () => {
    await requestNotificationPermission();
    onDone();
  };

  const handleSkip = () => {
    requestNotificationPermission(); // marks as asked even if skipped
    onDone();
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="bg-card rounded-2xl w-full max-w-sm shadow-2xl border border-border overflow-hidden">
        <div className="bg-foreground px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-accent" />
            <span className="font-heading font-bold text-white text-sm">Stay on top of services</span>
          </div>
          <button onClick={handleSkip} className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">
          <p className="font-semibold text-sm mb-1">Enable notifications?</p>
          <p className="text-xs text-muted-foreground mb-4">
            ServCheck will remind you after you check a quote to log whether you got the service done — helping build your full service history.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSkip} className="flex-1 h-11">Not now</Button>
            <Button onClick={handleAllow} className="flex-1 h-11 bg-accent text-accent-foreground font-heading font-semibold gap-2">
              <Bell className="h-4 w-4" /> Allow
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}