import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, X, Wrench } from "lucide-react";
import { dismissFollowUp } from "@/lib/notifications";

export default function ServiceFollowUpModal({ followUp, onDone }) {
  const [adding, setAdding] = useState(false);

  const handleYes = async () => {
    setAdding(true);
    await base44.entities.LogbookEntry.create({
      car_make: followUp.car.split(" ")[1] || "",
      car_model: followUp.car.split(" ").slice(2).join(" ") || "",
      car_year: followUp.car.split(" ")[0] || "",
      service_type: followUp.service,
      mechanic_name: followUp.mechanic || "",
      cost: followUp.price || undefined,
      state: followUp.state || "",
      suburb: followUp.suburb || "",
      service_date: new Date().toISOString().split("T")[0],
    });
    dismissFollowUp();
    toast.success("Service added to your logbook!");
    setAdding(false);
    onDone();
  };

  const handleNo = () => {
    dismissFollowUp();
    onDone();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="bg-card rounded-2xl w-full max-w-sm shadow-2xl border border-border overflow-hidden">
        <div className="bg-foreground px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-accent" />
            <span className="font-heading font-bold text-white text-sm">Service Follow-up</span>
          </div>
          <button onClick={handleNo} className="text-white/50 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">
          <p className="font-semibold text-sm mb-1">Did you go ahead with the service?</p>
          <p className="text-xs text-muted-foreground mb-4">
            You checked a quote for <strong>{followUp.service}</strong> on your <strong>{followUp.car}</strong>. Did you end up getting it done?
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleNo} className="flex-1 h-11">
              No / Skip
            </Button>
            <Button onClick={handleYes} disabled={adding} className="flex-1 h-11 bg-accent text-accent-foreground font-heading font-semibold gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {adding ? "Saving…" : "Yes, add to logbook"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}