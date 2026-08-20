import { useState } from "react";
import { ChevronLeft, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import LeadPreferencesSection from "./LeadPreferencesSection";

const PAGES = [
  { id: "lead-filters", label: "Lead Filters & Job Types", icon: "⚡" },
  { id: "fuel-types", label: "Fuel Type Preferences", icon: "⛽" },
  { id: "odometer", label: "Odometer & Vehicle Age", icon: "📊" },
];

export default function PreferencesPage({ profile, onUpdate, onBack }) {
  const [currentPage, setCurrentPage] = useState("lead-filters");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-5 py-4 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Settings
        </button>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-bold text-lg">Lead Preferences</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Customize which leads you see</p>
      </div>

      {/* Page Navigation */}
      <div className="border-b border-border px-5 py-3 flex-shrink-0 flex gap-2 overflow-x-auto">
        {PAGES.map(page => (
          <button
            key={page.id}
            onClick={() => setCurrentPage(page.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
              currentPage === page.id
                ? "bg-primary text-white"
                : "bg-secondary/40 text-foreground hover:bg-secondary/60"
            }`}
          >
            <span>{page.icon}</span> {page.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {currentPage === "lead-filters" && (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-heading font-bold mb-3">Job Types to Receive</p>
              <p className="text-xs text-muted-foreground mb-3">Leave all unselected to receive every job type.</p>
              <div className="space-y-2">
                {[
                  { key: "quick", label: "⚡ Quick Jobs", desc: "Oil change, battery, filters" },
                  { key: "standard", label: "🔧 Standard", desc: "Brakes, diagnostics, suspension" },
                  { key: "major", label: "🏭 Major / Workshop", desc: "Engine, transmission, rebuild" },
                ].map(({ key, label, desc }) => {
                  const selected = (profile?.pref_job_types || []).includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={async () => {
                        const current = profile.pref_job_types || [];
                        const updated = selected ? current.filter(x => x !== key) : [...current, key];
                        await window.base44.entities.MechanicProfile.update(profile.id, { pref_job_types: updated });
                        onUpdate();
                      }}
                      className={`w-full text-left rounded-xl border-2 px-3 py-2.5 transition-all ${selected ? "border-primary bg-primary/5" : "border-border bg-secondary/40 hover:border-primary/40"}`}
                    >
                      <p className={`text-xs font-semibold ${selected ? "text-primary" : "text-foreground"}`}>{label}</p>
                      <p className="text-[10px] text-muted-foreground">{desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {currentPage === "fuel-types" && (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-heading font-bold mb-3">Accepted Fuel Types</p>
              <p className="text-xs text-muted-foreground mb-3">Leave all unselected to accept all fuel types.</p>
              <div className="flex flex-wrap gap-2">
                {["Petrol", "Diesel", "Electric", "Hybrid", "PHEV", "LPG"].map(fuel => {
                  const selected = (profile?.pref_fuel_types || []).includes(fuel);
                  return (
                    <button
                      key={fuel}
                      type="button"
                      onClick={async () => {
                        const current = profile.pref_fuel_types || [];
                        const updated = selected ? current.filter(x => x !== fuel) : [...current, fuel];
                        await window.base44.entities.MechanicProfile.update(profile.id, { pref_fuel_types: updated });
                        onUpdate();
                      }}
                      className={`text-xs px-3 py-2 rounded-full border-2 font-semibold transition-all ${selected ? "border-primary bg-primary text-white" : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/40"}`}
                    >
                      {fuel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {currentPage === "odometer" && (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-heading font-bold mb-3">Max Odometer (km)</p>
              <p className="text-xs text-muted-foreground mb-3">Hide leads where the car odometer exceeds this. Leave blank for no limit.</p>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="e.g. 200000"
                  value={profile?.pref_max_odometer || ""}
                  onChange={e => {}}
                  onBlur={async (e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    await window.base44.entities.MechanicProfile.update(profile.id, { pref_max_odometer: val });
                    onUpdate();
                  }}
                  className="flex-1 h-10 rounded-lg bg-secondary/50 border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {profile?.pref_max_odometer > 0 && (
                  <button
                    onClick={async () => {
                      await window.base44.entities.MechanicProfile.update(profile.id, { pref_max_odometer: null });
                      onUpdate();
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive px-2 font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}