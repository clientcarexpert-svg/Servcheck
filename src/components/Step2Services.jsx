import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronUp, Camera, Upload, X, Wrench, Disc, Circle, Cog, Zap, Activity, Wind, Cpu, ClipboardCheck, Lightbulb, BatteryCharging, Plug, Thermometer, Gauge } from "lucide-react";

const CATEGORY_META = {
  "Routine Servicing":             { icon: Wrench,          color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    bar: "bg-blue-500" },
  "Brakes":                        { icon: Disc,            color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",     bar: "bg-red-500" },
  "Tyres & Wheels":                { icon: Circle,          color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", bar: "bg-emerald-500" },
  "Transmission & Drivetrain":     { icon: Cog,             color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-200",  bar: "bg-purple-500" },
  "Engine & Timing":               { icon: Zap,             color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200",  bar: "bg-orange-500" },
  "Suspension & Steering":         { icon: Activity,        color: "text-cyan-600",    bg: "bg-cyan-50",    border: "border-cyan-200",    bar: "bg-cyan-500" },
  "Cooling & Exhaust":             { icon: Wind,            color: "text-teal-600",    bg: "bg-teal-50",    border: "border-teal-200",    bar: "bg-teal-500" },
  "Electrical & AC":               { icon: Cpu,             color: "text-yellow-600",  bg: "bg-yellow-50",  border: "border-yellow-200",  bar: "bg-yellow-500" },
  "Lights & Wipers":               { icon: Lightbulb,       color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",   bar: "bg-amber-500" },
  "Inspections & Compliance":      { icon: ClipboardCheck,  color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-200",  bar: "bg-indigo-500" },
  // EV-specific
  "EV Servicing":                  { icon: Zap,             color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    bar: "bg-blue-500" },
  "High Voltage Battery & Charging": { icon: BatteryCharging, color: "text-green-600", bg: "bg-green-50",   border: "border-green-200",   bar: "bg-green-500" },
  "Electric Motor & Drivetrain":   { icon: Plug,            color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-200",  bar: "bg-purple-500" },
  "Regenerative Brakes":           { icon: Disc,            color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",     bar: "bg-red-500" },
  "Thermal Management & AC":       { icon: Thermometer,     color: "text-teal-600",    bg: "bg-teal-50",    border: "border-teal-200",    bar: "bg-teal-500" },
  "Electrical & Electronics":      { icon: Cpu,             color: "text-yellow-600",  bg: "bg-yellow-50",  border: "border-yellow-200",  bar: "bg-yellow-500" },
  "Other":                         { icon: Wrench,          color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200",   bar: "bg-slate-500" },
};

const DEFAULT_META = { icon: Wrench, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", bar: "bg-slate-400" };

export default function Step2Services({
  form, photos, setPhotos, cameraInputRef, fileInputRef,
  handleFileAdd, filteredServiceCategories, toggleService, update,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategories, setOpenCategories] = useState({});
  const [expandedMore, setExpandedMore] = useState({});
  const [showCustom, setShowCustom] = useState(!!form.custom_service);

  const toggleCategory = (label) => {
    setOpenCategories(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const searchLower = searchQuery.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!searchLower) return null;
    const hits = [];
    filteredServiceCategories.forEach(cat => {
      [...cat.services, ...(cat.more || [])].forEach(svc => {
        if (svc.toLowerCase().includes(searchLower) && !hits.includes(svc)) hits.push(svc);
      });
    });
    return hits;
  }, [searchLower, filteredServiceCategories]);

  const totalSelected = form.selected_services.length + (form.custom_service ? 1 : 0);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <p className="text-2xl font-heading font-black text-[#1a237e] mb-1 leading-tight">Services Quoted</p>
        <p className="text-sm text-slate-500 font-medium">Tap everything the mechanic has quoted you for.</p>
      </div>

      {/* Photo upload strip */}
      <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
        <div className="flex-1">
          <p className="text-xs font-bold text-orange-800">Attach a photo <span className="font-normal text-orange-500">(optional)</span></p>
          <p className="text-[11px] text-orange-500">Damaged part or mechanic quote</p>
        </div>
        <div className="flex gap-2">
          {photos.map((p, i) => (
            <div key={i} className="relative h-10 w-10 rounded-lg overflow-hidden border border-orange-300 flex-shrink-0">
              <img src={p.preview} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute top-0 right-0 h-4 w-4 bg-black/70 rounded-bl flex items-center justify-center">
                <X className="h-2.5 w-2.5 text-white" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => cameraInputRef.current?.click()}
            className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-colors flex-shrink-0 shadow-sm">
            <Camera className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="h-10 w-10 rounded-xl bg-white border border-orange-200 flex items-center justify-center text-orange-500 hover:bg-orange-100 transition-colors flex-shrink-0">
            <Upload className="h-4 w-4" />
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileAdd} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileAdd} />
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder='Search, e.g. "brakes" or "timing belt"…'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="h-12 pl-10 bg-white border-2 border-slate-200 focus:border-[#1a237e] font-medium text-sm text-slate-800 placeholder:text-slate-400 rounded-xl transition-colors"
        />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Selected pills */}
      {totalSelected > 0 && (
        <div className="rounded-2xl bg-[#1a237e]/5 border border-[#1a237e]/20 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a237e]/60 mb-2">{totalSelected} selected</p>
          <div className="flex flex-wrap gap-1.5">
            {form.selected_services.map(svc => (
              <button key={svc} type="button" onClick={() => toggleService(svc)}
                className="flex items-center gap-1 text-[11px] font-bold bg-[#1a237e] text-white rounded-full px-3 py-1.5 hover:bg-[#1a237e]/80 transition-colors shadow-sm">
                {svc} <X className="h-2.5 w-2.5 ml-0.5 opacity-70" />
              </button>
            ))}
            {form.custom_service && (
              <button type="button" onClick={() => { update("custom_service", ""); setShowCustom(false); }}
                className="flex items-center gap-1 text-[11px] font-bold bg-[#1a237e] text-white rounded-full px-3 py-1.5 hover:bg-[#1a237e]/80 transition-colors shadow-sm">
                {form.custom_service} <X className="h-2.5 w-2.5 ml-0.5 opacity-70" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Service list */}
      <div className="space-y-2 pr-1 pb-1">
        {searchResults ? (
          searchResults.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {searchResults.map(label => {
                const checked = form.selected_services.includes(label);
                return (
                  <button key={label} type="button" onClick={() => toggleService(label)}
                    className={`text-left px-3 py-3 rounded-xl text-xs font-bold border-2 transition-all leading-tight ${
                      checked
                        ? "bg-[#1a237e] border-[#1a237e] text-white shadow-md"
                        : "bg-white border-slate-200 text-slate-700 hover:border-[#1a237e]/40 hover:bg-[#1a237e]/5"
                    }`}>
                    {label}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No services match "{searchQuery}"</p>
          )
        ) : (
          filteredServiceCategories.filter(cat => cat.label !== "Other").map(cat => {
            const meta = CATEGORY_META[cat.label] || DEFAULT_META;
            const Icon = meta.icon;
            const isOpen = !!openCategories[cat.label];
            const selectedInCat = cat.services.filter(s => form.selected_services.includes(s)).length;
            return (
              <div key={cat.label} className={`rounded-2xl border-2 overflow-hidden transition-all ${isOpen ? `${meta.border} shadow-sm` : "border-slate-100"}`}>
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.label)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors ${isOpen ? meta.bg : "bg-white hover:bg-slate-50"}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`h-7 w-7 rounded-lg ${isOpen ? meta.bg : "bg-slate-100"} flex items-center justify-center flex-shrink-0 border ${isOpen ? meta.border : "border-slate-200"}`}>
                      <Icon className={`h-3.5 w-3.5 ${isOpen ? meta.color : "text-slate-500"}`} />
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wide ${isOpen ? meta.color : "text-slate-700"}`}>{cat.label}</span>
                    {selectedInCat > 0 && (
                      <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">{selectedInCat}</span>
                    )}
                  </div>
                  {isOpen
                    ? <ChevronUp className={`h-4 w-4 ${meta.color}`} />
                    : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>
                {isOpen && (() => {
                  const moreList = (cat.more || []).filter(s => s !== "Other");
                  const isMoreOpen = !!expandedMore[cat.label];
                  const moreSelectedCount = moreList.filter(s => form.selected_services.includes(s)).length;
                  const renderBtn = (label) => {
                    const checked = form.selected_services.includes(label);
                    return (
                      <button key={label} type="button" onClick={() => toggleService(label)}
                        className={`text-left px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all leading-tight ${
                          checked
                            ? `${meta.bg} ${meta.border} ${meta.color} shadow-sm`
                            : "bg-slate-50 border-slate-100 text-slate-700 hover:border-slate-300 hover:bg-white"
                        }`}>
                        {checked && <span className="inline-block mr-1">✓</span>}
                        {label}
                      </button>
                    );
                  };
                  return (
                    <div className="p-2.5 bg-white border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-1.5">
                        {cat.services.filter(s => s !== "Other").map(renderBtn)}
                        {isMoreOpen && moreList.map(renderBtn)}
                      </div>
                      {moreList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedMore(prev => ({ ...prev, [cat.label]: !prev[cat.label] }))}
                          className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold ${meta.bg} ${meta.color} hover:brightness-95 active:scale-[0.99] transition-all`}
                        >
                          {isMoreOpen ? (
                            <>Show less options <ChevronUp className="h-3.5 w-3.5" /></>
                          ) : (
                            <>
                              Show {moreList.length} more options
                              {moreSelectedCount > 0 && <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded-full text-[10px]">{moreSelectedCount}</span>}
                              <ChevronDown className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })
        )}
      </div>

      {/* Can't find it? */}
      {!showCustom ? (
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#1a237e] to-[#283593] text-white text-xs font-bold tracking-wide shadow-md hover:shadow-lg hover:opacity-90 active:scale-[0.98] transition-all mt-1 flex items-center justify-center gap-2"
        >
          <span className="text-base leading-none">+</span> Can't find your service? Add it here
        </button>
      ) : (
        <div className="space-y-2 rounded-2xl border-2 border-[#1a237e]/20 bg-[#1a237e]/5 p-3">
          <label className="text-xs font-bold uppercase tracking-widest text-[#1a237e]">Custom Service</label>
          <Input
            placeholder="e.g. Fuel injector clean, gearbox rebuild…"
            value={form.custom_service}
            onChange={e => update("custom_service", e.target.value)}
            className="h-11 bg-white border-2 border-[#1a237e]/20 font-medium text-sm rounded-xl"
            autoFocus
          />
          {!form.custom_service && (
            <button type="button" onClick={() => setShowCustom(false)} className="text-xs text-slate-400 hover:text-slate-700 transition-colors font-medium">
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}