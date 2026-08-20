import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Zap, Fuel, Gauge, TrendingUp, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Same service categories as the user quote form
const SERVICE_CATEGORIES = [
  { label: "Routine Servicing", services: ["Basic Service","Log Book Service","Oil & Filter Change","Spark Plugs","Air Filter","Cabin Air Filter","Fuel Filter","Coolant Flush"], more: ["Minor Service","Major Service","Capped Price Service","Engine Oil Top-Up","Glow Plugs Replacement","Brake Fluid Flush","Power Steering Fluid Flush","Wiper Blade Replacement","Headlight Globe Replacement"] },
  { label: "Brakes", services: ["Brake Pads (Front)","Brake Pads (Rear)","Brake Rotors","Brake Fluid Flush","Brake Caliper Service","Handbrake / Park Brake"], more: ["Brake Pads (Front & Rear)","Brake Rotors (Front)","Brake Rotors (Rear)","Brake Rotor Machining","Brake Caliper Replacement","Brake Hose Replacement","Brake Master Cylinder","Brake Booster","ABS Sensor Replacement","ABS Module Repair","Handbrake Cable Replacement","Brake Squeal Diagnosis"] },
  { label: "Tyres & Wheels", services: ["Tyre Replacement (x1)","Tyre Replacement (x2)","Tyre Replacement (x4)","Tyre Rotation","Wheel Alignment","Wheel Balancing","Puncture Repair"], more: ["Wheel Alignment (4-Wheel)","Wheel Bearing Replacement","TPMS Sensor Replacement / Repair","Nitrogen Tyre Fill","Rim Repair","Tyre Valve Replacement","Tyre Pressure Check"] },
  { label: "Transmission & Drivetrain", services: ["Transmission Service","Gearbox Repair","Clutch Replacement","Differential Service","Transfer Case Service","CV Joint / Boot"], more: ["Automatic Transmission Service","Manual Transmission Service","CVT Transmission Service","DSG / DCT Service","Transmission Fluid Flush","Transmission Rebuild","Transmission Replacement","Gearbox Rebuild","Gearbox Replacement","Clutch Master Cylinder","Clutch Slave Cylinder","Flywheel Replacement","Dual Mass Flywheel Replacement","Differential Repair","Driveshaft Repair","Tailshaft / Uni Joint"] },
  { label: "Engine & Timing", services: ["Timing Belt","Timing Chain","Head Gasket","Engine Tune-Up","Valve Clearance Check"], more: ["Timing Belt Kit (Belt + Water Pump)","Timing Chain Tensioner","Engine Mount Replacement","Carbon Clean / Walnut Blast","Fuel Injector Clean","Fuel Injector Replacement","Throttle Body Clean","Throttle Body Replacement","EGR Valve Clean","EGR Valve Replacement","Turbocharger Repair","Turbocharger Replacement","PCV Valve Replacement","Oil Leak Diagnosis & Repair","Rocker Cover Gasket","Sump Gasket Replacement","Engine Rebuild","Engine Replacement / Swap"] },
  { label: "Suspension & Steering", services: ["Shock Absorbers","Struts","Suspension Repair","Power Steering Service","Control Arms","Ball Joints","Tie Rods","Wheel Bearings"], more: ["Shock Absorbers (Front Pair)","Shock Absorbers (Rear Pair)","Coil Spring Replacement","Sway Bar Links","Suspension Bush Replacement","Power Steering Pump","Power Steering Rack","Electric Power Steering Repair","Inner Tie Rod Replacement","Steering Column Repair","Suspension Knock / Diagnosis"] },
  { label: "Cooling & Exhaust", services: ["Radiator","Radiator Hoses","Thermostat","Water Pump","Exhaust Repair","Catalytic Converter","DPF Clean / Replacement"], more: ["Radiator Repair","Cooling Fan Replacement","Heater Hose Replacement","Muffler Replacement","Oxygen (O2) Sensor Replacement","Exhaust Manifold Gasket","AdBlue / SCR System Repair"] },
  { label: "Electrical & AC", services: ["Battery Replacement","Alternator","Starter Motor","Air Con Regas","Air Con Repair","Heater Core"], more: ["Battery Test","Auxiliary / AGM Battery Replacement","Alternator Repair","Starter Motor Repair","Fuse / Relay Replacement","Wiring Repair","ECU Diagnosis","ECU Replacement / Reprogram","Power Window Motor / Regulator","Central Locking Repair","Key / Remote Programming","Air Con Leak Test","Air Con Compressor Replacement","Air Con Condenser Replacement","Air Con Evaporator Replacement","Heater Fan / Blower Motor","Headlight Restoration","Headlight Assembly Replacement"] },
  { label: "Lights & Wipers", services: ["Headlight Globe Replacement","Tail Light Globe","Indicator / Blinker Globe","Brake Light Globe","Wiper Blades (Front)","Wiper Blades (Rear)","Number Plate Light"], more: ["Headlight Assembly Replacement","Headlight Restoration / Polish","High Beam Globe","Fog Light Globe / Replacement","Daytime Running Light (DRL)","Side Marker / Side Light","Reverse Light Globe","Interior Cabin Light","Wiper Motor Replacement","Wiper Arm / Linkage","Washer Pump Replacement","Washer Nozzle / Jet Repair","Rain Sensor Replacement","Cracked Headlight Lens Repair"] },
  { label: "Inspections & Compliance", services: ["Pink Slip (NSW Safety Check)","Roadworthy Certificate","Pre-purchase Inspection","Logbook Inspection","Registration Renewal Inspection","Emission Test","Blue Slip (NSW Unregistered)"], more: ["Roadworthy Certificate (VIC RWC)","Safety Certificate (QLD)","Roadworthy Inspection (SA / WA / TAS)","Pre-Purchase Inspection (with Report)","Diagnostic Scan (Fault Codes)","Compliance / Mod Plate Inspection","Insurance Damage Report"] },
  { label: "EV & Hybrid Services", services: ["EV Battery Health Check","EV Battery Replacement","EV Charging System Diagnosis","Hybrid Battery Service","Hybrid Battery Replacement","Inverter / Converter Service","Electric Motor Service"], more: ["High Voltage System Inspection","EV Thermal Management Service","Regenerative Braking Service","On-Board Charger Repair","DC Fast Charge Port Repair","AC Charge Port Repair","12V Auxiliary Battery (EV)","EV Software Update / Recalibration","PHEV Battery Service","PHEV Charging System Repair","EV Pre-Purchase Inspection","EV Annual Safety Inspection"] },
];

export default function LeadPreferencesSection({ profile, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);
  const [hasChanges, setHasChanges] = useState(false);
  const [openCategories, setOpenCategories] = useState({});
  const [expandedMore, setExpandedMore] = useState({});

  const updateLocal = (field, value) => {
    setLocalProfile(p => ({ ...p, [field]: value }));
    setHasChanges(true);
  };

  const saveAll = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('updateMechanicPreferences', {
        profileId: profile.id,
        prefJobTypes: localProfile.pref_job_types,
        prefFuelTypes: localProfile.pref_fuel_types,
        prefCarMakes: localProfile.pref_car_makes,
        prefMaxOdometer: localProfile.pref_max_odometer,
      });
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Server rejected the save');
      }
      toast.success("Preferences saved!");
      if (onUpdate) onUpdate();
      setHasChanges(false);
    } catch (err) {
      console.error("Save error:", err);
      toast.error(`Save failed: ${err?.response?.data?.error || err?.message || 'unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => {
    setLocalProfile(profile);
    setHasChanges(false);
  };

  const CAR_MAKES = [
    "Toyota", "Honda", "Ford", "Mazda", "Hyundai", "Kia", "Volkswagen", "BMW", "Mercedes", "Audi", 
    "Subaru", "Nissan", "Mitsubishi", "Holden", "Isuzu", "Suzuki", "Jeep", "Lexus", "Skoda",
    "Porsche", "Tesla", "BYD", "MG", "Citroën", "Peugeot", "Renault", "Fiat", "Alfa Romeo",
    "Volvo", "Jaguar", "Land Rover", "Aston Martin", "McLaren", "Dacia", "Proton", "Perodua",
    "Tata", "Mahindra", "GWM", "LDV", "Cupra", "Genesis", "Chery"
  ];
  
  const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "Hybrid", "PHEV", "LPG"];

  const toggleJobType = (svc) => {
    const current = localProfile.pref_job_types || [];
    const next = current.includes(svc) ? current.filter(x => x !== svc) : [...current, svc];
    updateLocal("pref_job_types", next);
  };

  const toggleItem = (type, value) => {
    const field = type === "make" ? "pref_car_makes" : "pref_fuel_types";
    const current = localProfile[field] || [];
    updateLocal(field, current.includes(value) ? current.filter(x => x !== value) : [...current, value]);
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Job Types Section */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-heading font-bold text-sm">Job Types to Receive</p>
            <p className="text-xs text-muted-foreground">Leave empty to receive all. Tap categories to expand.</p>
          </div>
        </div>

        {/* Selected pills */}
        {(localProfile.pref_job_types || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-1">
            {(localProfile.pref_job_types || []).map(job => (
              <button key={job} onClick={() => toggleJobType(job)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                {job} <X className="h-2.5 w-2.5" />
              </button>
            ))}
          </div>
        )}
        {(localProfile.pref_job_types || []).length === 0 && (
          <div className="text-xs text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2">
            ✓ All job types — you'll see every lead
          </div>
        )}

        {/* Category accordion */}
        <div className="space-y-1.5">
          {SERVICE_CATEGORIES.map(cat => {
            const allServices = [...cat.services, ...(cat.more || [])];
            const selectedInCat = allServices.filter(s => (localProfile.pref_job_types || []).includes(s)).length;
            const isOpen = !!openCategories[cat.label];
            const isMoreOpen = !!expandedMore[cat.label];
            return (
              <div key={cat.label} className={`rounded-xl border overflow-hidden ${isOpen ? "border-primary/30" : "border-border"}`}>
                <button
                  type="button"
                  onClick={() => setOpenCategories(p => ({ ...p, [cat.label]: !p[cat.label] }))}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${isOpen ? "bg-primary/5" : "bg-secondary/30 hover:bg-secondary/60"}`}
                >
                  <span className="text-xs font-bold text-foreground">{cat.label}</span>
                  <div className="flex items-center gap-2">
                    {selectedInCat > 0 && <span className="text-[10px] bg-accent text-white px-1.5 py-0.5 rounded-full font-bold">{selectedInCat}</span>}
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="p-2 bg-card border-t border-border">
                    <div className="flex flex-wrap gap-1.5">
                      {cat.services.map(svc => {
                        const checked = (localProfile.pref_job_types || []).includes(svc);
                        return (
                          <button key={svc} type="button" onClick={() => toggleJobType(svc)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${checked ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground hover:border-primary/40"}`}>
                            {checked && "✓ "}{svc}
                          </button>
                        );
                      })}
                      {isMoreOpen && (cat.more || []).map(svc => {
                        const checked = (localProfile.pref_job_types || []).includes(svc);
                        return (
                          <button key={svc} type="button" onClick={() => toggleJobType(svc)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${checked ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground hover:border-primary/40"}`}>
                            {checked && "✓ "}{svc}
                          </button>
                        );
                      })}
                    </div>
                    {(cat.more || []).length > 0 && (
                      <button type="button" onClick={() => setExpandedMore(p => ({ ...p, [cat.label]: !p[cat.label] }))}
                        className="mt-2 w-full text-[11px] font-semibold text-primary flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-primary/5 transition-colors">
                        {isMoreOpen ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> +{cat.more.length} more options</>}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fuel Types Section */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Fuel className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-heading font-bold text-sm">Accepted Fuel Types</p>
            <p className="text-xs text-muted-foreground">Leave empty to accept all fuel types</p>
          </div>
        </div>
        <Select value="" onValueChange={(val) => toggleItem("fuel", val)}>
          <SelectTrigger className="h-10 bg-secondary/50 border-border">
            <SelectValue placeholder="Add fuel type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__" className="font-bold">✓ All Fuel Types</SelectItem>
            {FUEL_TYPES.filter(ft => !(localProfile.pref_fuel_types || []).includes(ft)).map(ft => (
              <SelectItem key={ft} value={ft}>{ft}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(localProfile.pref_fuel_types || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(localProfile.pref_fuel_types || []).map(fuel => (
              <div key={fuel} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                {fuel}
                <button onClick={() => toggleItem("fuel", fuel)} className="hover:opacity-70">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {(localProfile.pref_fuel_types || []).length === 0 && (
          <div className="text-xs text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2">
            ✓ All fuel types selected — you'll see all available leads
          </div>
        )}
      </div>

      {/* Car Makes Section */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-heading font-bold text-sm">Preferred Car Makes</p>
            <p className="text-xs text-muted-foreground">Leave empty to accept all car makes</p>
          </div>
        </div>
        <Select value="" onValueChange={(val) => toggleItem("make", val)}>
          <SelectTrigger className="h-10 bg-secondary/50 border-border">
            <SelectValue placeholder="Add car make..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__" className="font-bold">✓ All Car Makes</SelectItem>
            {CAR_MAKES.filter(make => !(localProfile.pref_car_makes || []).includes(make)).map(make => (
              <SelectItem key={make} value={make}>{make}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(localProfile.pref_car_makes || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(localProfile.pref_car_makes || []).map(make => (
              <div key={make} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                {make}
                <button onClick={() => toggleItem("make", make)} className="hover:opacity-70">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {(localProfile.pref_car_makes || []).length === 0 && (
          <div className="text-xs text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2">
            ✓ All car makes selected — you'll see all available leads
          </div>
        )}
      </div>

      {/* Max Odometer Section */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Gauge className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-heading font-bold text-sm">Max Odometer (km)</p>
            <p className="text-xs text-muted-foreground">Hide leads where the car odometer exceeds this</p>
          </div>
        </div>
        <div className="flex gap-2 items-center max-w-sm">
          <input
            type="number"
            placeholder="e.g. 200000"
            value={localProfile?.pref_max_odometer || ""}
            onChange={e => {
              const val = e.target.value ? Number(e.target.value) : null;
              updateLocal("pref_max_odometer", val);
            }}
            className="flex-1 h-10 rounded-lg bg-secondary border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {localProfile?.pref_max_odometer > 0 && (
            <button
              onClick={() => updateLocal("pref_max_odometer", null)}
              className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg bg-secondary border border-border p-3 space-y-1">
        <p className="text-xs font-semibold text-foreground">
          💡 Filters apply to your Live Leads feed
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          You'll only see leads matching your selected criteria. Save changes when done.
        </p>
      </div>

      {/* Save/Cancel Buttons */}
      {hasChanges && (
        <div className="flex gap-2">
          <Button
            onClick={cancel}
            variant="outline"
            className="flex-1 h-10 font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={saveAll}
            disabled={loading}
            className="flex-1 h-10 font-semibold bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}