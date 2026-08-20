import { useState, useEffect, useRef } from "react";
import SEOHead from "../components/SEOHead";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Search, MapPin, Gauge, Camera, Upload, X, Loader2, Eye, MessageSquare, ChevronRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { SUBURBS_BY_STATE } from "@/lib/suburbs";
import ListingDetailModal from "@/components/ListingDetailModal";

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
const CAR_MAKES_MODELS = {
  Toyota: ["Camry", "Corolla", "RAV4", "HiLux", "LandCruiser", "Prado", "Yaris", "Kluger", "Fortuner", "C-HR", "86", "GR Yaris", "Tarago", "HiAce", "Aurion"],
  Mazda: ["Mazda2", "Mazda3", "Mazda6", "CX-3", "CX-5", "CX-8", "CX-9", "BT-50", "MX-5"],
  Hyundai: ["i20", "i30", "i30N", "Elantra", "Sonata", "Tucson", "Santa Fe", "Kona", "Venue", "Staria", "iLoad"],
  Kia: ["Picanto", "Rio", "Cerato", "Stinger", "Sportage", "Sorento", "Carnival", "Seltos", "EV6"],
  Ford: ["Fiesta", "Focus", "Mustang", "Ranger", "Everest", "Explorer", "Escape", "Transit", "Bronco", "F-150"],
  Holden: ["Commodore", "Astra", "Colorado", "Trax", "Equinox", "Captiva", "Cruze", "Barina", "Spark"],
  Mitsubishi: ["Mirage", "Lancer", "Eclipse Cross", "Outlander", "ASX", "Triton", "Pajero", "Pajero Sport", "Express"],
  Nissan: ["Micra", "Pulsar", "Altima", "Maxima", "X-Trail", "Qashqai", "Juke", "Navara", "Patrol", "Pathfinder", "Leaf"],
  Subaru: ["Impreza", "WRX", "BRZ", "Outback", "Forester", "XV", "Liberty", "Levorg"],
  Honda: ["Jazz", "City", "Civic", "Accord", "HR-V", "CR-V", "Odyssey"],
  Volkswagen: ["Polo", "Golf", "Golf GTI", "Golf R", "Passat", "Tiguan", "Touareg", "Amarok", "T-Roc", "ID.4"],
  BMW: ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "M3", "M5"],
  Mercedes: ["A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLC", "GLE", "GLS", "AMG GT"],
  Audi: ["A1", "A3", "A4", "A5", "A6", "Q2", "Q3", "Q5", "Q7", "TT", "R8", "e-tron"],
  Lexus: ["IS", "ES", "GS", "LS", "UX", "NX", "RX", "GX", "LX", "LC"],
  Isuzu: ["D-Max", "MU-X"],
  Jeep: ["Wrangler", "Cherokee", "Grand Cherokee", "Compass", "Renegade"],
  Suzuki: ["Swift", "Baleno", "Vitara", "Jimny", "S-Cross"],
  Volvo: ["S60", "S90", "XC40", "XC60", "XC90"],
  Peugeot: ["208", "308", "3008", "2008"],
  Renault: ["Clio", "Megane", "Koleos"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck"],
  GWM: ["Ute", "Haval H6", "Haval Jolion", "Tank 300"],
  MG: ["ZS", "HS", "MG4"],
  BYD: ["Atto 3", "Seal", "Dolphin"],
  Porsche: ["911", "Cayenne", "Macan", "Taycan"],
  "Land Rover": ["Defender", "Discovery", "Range Rover", "Range Rover Sport"],
  Skoda: ["Octavia", "Superb", "Kodiaq"],
};

const CAR_MAKES = Object.keys(CAR_MAKES_MODELS).sort();
const selectClass = "h-11 w-full rounded-lg bg-secondary/50 border-0 px-3 font-medium text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent";

export default function Marketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [search, setSearch] = useState("");
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [form, setForm] = useState({
    car_make: "", car_model: "", car_year: "",
    odometer: "", asking_price: "",
    state: "", suburb: "",
    transmission: "", service_history: "", rego_expiry: "",
    condition: "", description: ""
  });

  const [aiValuation, setAiValuation] = useState(null);
  const [runningValuation, setRunningValuation] = useState(false);
  const [useValuation, setUseValuation] = useState(false);

  useEffect(() => {
    if (user?.role === "mechanic") {
      toast.error("Mechanics cannot list cars. This is for individual sellers only.");
      return;
    }
    loadListings();
  }, [user]);

  const loadListings = async () => {
    setLoading(true);
    const items = await base44.entities.CarListing.list("-created_date", 500);
    setListings(items);
    setLoading(false);
  };

  const handlePhotoAdd = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotos(prev => [...prev, { file, preview: ev.target.result }]);
      reader.readAsDataURL(file);
    });
  };

  const runAiValuation = async () => {
    if (!form.car_make || !form.car_model || !form.car_year || !form.odometer || !form.asking_price) {
      toast.error("Fill car details and price first");
      return;
    }
    setRunningValuation(true);
    try {
      // Deduct 5 credits
      const deductRes = await base44.functions.invoke("deductCredits", { amount: 5 });
      if (deductRes.data?.error) {
        toast.error(deductRes.data.error);
        setRunningValuation(false);
        return;
      }

      const prompt = `You are an expert Australian used car valuation advisor. Evaluate this car independently:
- ${form.car_year} ${form.car_make} ${form.car_model}
- Odometer: ${parseInt(form.odometer).toLocaleString()} km
- Asking price: $${parseInt(form.asking_price).toLocaleString()} AUD
- Location: ${form.suburb}, ${form.state}
- Transmission: ${form.transmission || "unknown"}
- Service history: ${form.service_history || "unknown"}
- Rego expiry: ${form.rego_expiry || "unknown"}

DO NOT rely on the condition stated by the seller. Assess the vehicle's fair market value independently based on age, mileage, transmission, and service history. Provide fair market valuation and verdict.`;
      
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            market_price_low: { type: "number" },
            market_price_high: { type: "number" },
            market_price_average: { type: "number" },
            price_verdict: { type: "string" },
            summary: { type: "string" }
          }
        }
      });
      setAiValuation(res);
      setUseValuation(false);
    } catch (err) {
      toast.error("Valuation failed");
      console.error(err);
    } finally {
      setRunningValuation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (photos.length === 0) { toast.error("Add at least one photo"); return; }
    
    const car_make = form.car_make === "Other" ? form._customMake : form.car_make;
    const car_model = form.car_model;
    const suburb = form.suburb === "Other" ? form._customSuburb : form.suburb;
    
    if (!car_make) { toast.error("Select or type car make"); return; }
    if (!car_model) { toast.error("Select or type car model"); return; }
    if (!form.car_year) { toast.error("Select year"); return; }
    if (!form.odometer) { toast.error("Enter odometer"); return; }
    if (!form.asking_price) { toast.error("Enter asking price"); return; }
    if (!form.state) { toast.error("Select state"); return; }
    if (!suburb) { toast.error("Select or type suburb"); return; }

    setUploading(true);
    try {
      let photoUrls = [];
      for (const photo of photos) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: photo.file });
        photoUrls.push(file_url);
      }

      const listingData = {
        car_make,
        car_model,
        car_year: form.car_year,
        odometer: parseInt(form.odometer) || 0,
        asking_price: parseInt(form.asking_price) || 0,
        state: form.state,
        suburb,
        transmission: form.transmission || undefined,
        service_history: form.service_history || undefined,
        condition: form.condition || "good",
        description: form.description || undefined,
        rego_expiry: form.rego_expiry || undefined,
        photo_urls: photoUrls,
        seller_email: user.email,
        is_active: true,
        listed_date: new Date().toISOString()
      };

      if (useValuation && aiValuation) {
        listingData.market_price_low = aiValuation.market_price_low;
        listingData.market_price_high = aiValuation.market_price_high;
        listingData.market_price_average = aiValuation.market_price_average;
        listingData.price_verdict = aiValuation.price_verdict;
      }

      await base44.entities.CarListing.create(listingData);
      toast.success("Car listed successfully!");
      setForm({ car_make: "", car_model: "", car_year: "", odometer: "", asking_price: "", state: "", suburb: "", transmission: "", service_history: "", rego_expiry: "", condition: "", description: "" });
      setPhotos([]);
      setAiValuation(null);
      setUseValuation(false);
      setShowForm(false);
      loadListings();
    } catch (err) {
      toast.error("Failed to list car");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const filteredListings = listings.filter(l =>
    l.is_active && (
      l.car_make?.toLowerCase().includes(search.toLowerCase()) ||
      l.car_model?.toLowerCase().includes(search.toLowerCase()) ||
      l.suburb?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const userListings = listings.filter(l => l.seller_email === user?.email);

  if (user?.role === "mechanic") return null;

  return (
    <div>
      <SEOHead
        title="Car Parts & Services Marketplace | ServCheck Australia"
        description="Browse car parts and services from trusted Australian suppliers. Compare prices and find the best deal for your vehicle."
        path="/marketplace"
      />
      <div className="bg-gradient-to-br from-[#1a237e] to-[#1565c0] py-12 px-4 mb-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-8 flex-wrap">
            <div className="max-w-2xl">
              <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-2">ServCheck Marketplace</p>
              <h1 className="font-heading font-black text-3xl sm:text-4xl text-white mb-3 leading-tight">Sell Your Car</h1>
              <p className="text-blue-200 text-base">Market valuations. Transparent pricing. Real buyers.</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} size="lg" className="gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-white h-12 px-6 flex-shrink-0 mt-2 shadow-lg shadow-orange-900/30 rounded-2xl font-heading font-bold">
              <Plus className="h-5 w-5" /> List Your Car
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-xl font-bold text-white mb-1">~5 min</div>
              <p className="text-xs text-blue-200">Complete a listing in minutes</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
             <div className="text-xl font-bold text-white mb-1">Smart Pricing</div>
             <p className="text-xs text-blue-200">Market valuations buyers trust</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-xl font-bold text-white mb-1">Photos</div>
              <p className="text-xs text-blue-200">Showcase with full specs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-8 mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-heading font-bold text-2xl">Create Your Listing</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  {form.car_make === "Other" ? (
                    <Input placeholder="Type make..." value={form._customMake || ""} onChange={e => setForm({...form, _customMake: e.target.value})} className="h-11 bg-secondary/50 border-0 font-medium" />
                  ) : (
                    <select value={form.car_make} onChange={e => setForm({...form, car_make: e.target.value, car_model: ""})} className={selectClass}>
                      <option value="" disabled>Make</option>
                      {CAR_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                      <option value="Other">Other</option>
                    </select>
                  )}
                </div>
                <div>
                  {form.car_make === "Other" ? (
                    <Input placeholder="Type model..." value={form.car_model} onChange={e => setForm({...form, car_model: e.target.value})} className="h-11 bg-secondary/50 border-0 font-medium" />
                  ) : form.car_make ? (
                    <select value={form.car_model} onChange={e => setForm({...form, car_model: e.target.value})} className={selectClass}>
                      <option value="" disabled>Model</option>
                      {CAR_MAKES_MODELS[form.car_make]?.map(m => <option key={m} value={m}>{m}</option>)}
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <select disabled className={`${selectClass} opacity-50`}><option>Select make first</option></select>
                  )}
                </div>
                <select value={form.car_year} onChange={e => setForm({...form, car_year: e.target.value})} className={selectClass}>
                  <option value="" disabled>Year</option>
                  {Array.from({ length: 35 }, (_, i) => String(new Date().getFullYear() - i)).map(yr => <option key={yr} value={yr}>{yr}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Odometer (km)</label>
                  <Input type="number" placeholder="e.g. 95000" value={form.odometer} onChange={e => setForm({...form, odometer: e.target.value})} className="h-11 bg-secondary/50 border-0 font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Asking Price (AUD)</label>
                  <Input type="number" placeholder="e.g. 15000" value={form.asking_price} onChange={e => setForm({...form, asking_price: e.target.value})} className="h-11 bg-secondary/50 border-0 font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select value={form.state} onChange={e => setForm({...form, state: e.target.value, suburb: ""})} className={selectClass}>
                  <option value="" disabled>State</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div>
                  {form.suburb === "Other" ? (
                    <Input placeholder="Type suburb..." value={form._customSuburb || ""} onChange={e => setForm({...form, _customSuburb: e.target.value, suburb: e.target.value})} className="h-11 bg-secondary/50 border-0 font-medium" />
                  ) : form.state ? (
                    <select value={form.suburb} onChange={e => setForm({...form, suburb: e.target.value})} className={selectClass}>
                      <option value="" disabled>Suburb</option>
                      {[...(SUBURBS_BY_STATE[form.state] || [])].sort().map(s => <option key={s} value={s}>{s}</option>)}
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <select disabled className={`${selectClass} opacity-50`}><option>Select state first</option></select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select value={form.transmission} onChange={e => setForm({...form, transmission: e.target.value})} className={selectClass}>
                  <option value="" disabled>Transmission</option>
                  <option value="auto">Automatic</option>
                  <option value="manual">Manual</option>
                  <option value="cvt">CVT</option>
                  <option value="Other">Other</option>
                </select>
                <select value={form.service_history} onChange={e => setForm({...form, service_history: e.target.value})} className={selectClass}>
                  <option value="" disabled>Service History</option>
                  <option value="full_dealer">Full Dealer</option>
                  <option value="partial">Partial</option>
                  <option value="logbook_only">Logbook Only</option>
                  <option value="none">None</option>
                </select>
                <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} className={selectClass}>
                  <option value="" disabled>Condition</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Rego Expiry (MM/YYYY)</label>
                <Input placeholder="e.g. 06/2025" value={form.rego_expiry} onChange={e => setForm({...form, rego_expiry: e.target.value})} className="h-11 bg-secondary/50 border-0 font-medium" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Description (optional)</label>
                <textarea placeholder="Condition, features, any damage..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full h-20 rounded-lg bg-secondary/50 border-0 px-3 py-2 font-medium text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none" />
              </div>

              <div className="border-2 border-accent/30 rounded-xl p-4 bg-accent/5 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" />
                  <p className="font-semibold text-sm">Get Market Valuation (5 credits)</p>
                </div>
                {!aiValuation ? (
                  <Button type="button" onClick={runAiValuation} disabled={runningValuation} className="w-full h-10 gap-2 bg-accent hover:bg-accent/90 text-white">
                    {runningValuation ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</> : <><Zap className="h-4 w-4" /> Run Valuation (5 credits)</>}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="bg-white rounded p-2"><p className="text-xs text-muted-foreground">Low</p><p className="font-bold">${aiValuation.market_price_low?.toLocaleString()}</p></div>
                      <div className="bg-white rounded p-2"><p className="text-xs text-muted-foreground">Average</p><p className="font-bold text-accent">${aiValuation.market_price_average?.toLocaleString()}</p></div>
                      <div className="bg-white rounded p-2"><p className="text-xs text-muted-foreground">High</p><p className="font-bold">${aiValuation.market_price_high?.toLocaleString()}</p></div>
                    </div>
                    <label className="flex items-center gap-2 p-2 bg-white rounded cursor-pointer hover:bg-accent/5 transition-colors">
                      <input type="checkbox" checked={useValuation} onChange={e => setUseValuation(e.target.checked)} className="w-4 h-4" />
                      <span className="text-sm">Post this valuation with listing</span>
                    </label>
                    <Button type="button" onClick={() => setAiValuation(null)} variant="outline" className="w-full h-9 text-sm">Clear & Re-run</Button>
                  </div>
                )}
              </div>

              <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Upload Photos (Min. 1)</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {photos.map((p, i) => (
                    <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-border">
                      <img src={p.preview} alt="" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 h-4 w-4 bg-black/70 rounded-bl flex items-center justify-center">
                        <X className="h-2.5 w-2.5 text-white" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => cameraInputRef.current?.click()} className="h-16 w-16 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent hover:bg-accent/20 transition-colors">
                      <Camera className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="h-16 w-16 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
                      <Upload className="h-4 w-4" />
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoAdd} />
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoAdd} />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={uploading || photos.length === 0} className="flex-1 h-12 bg-accent hover:bg-accent/90 text-white font-heading font-bold gap-2">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {uploading ? "Uploading..." : "List Car"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="h-12">Cancel</Button>
              </div>
            </form>
          </motion.div>
        )}

        {userListings.length > 0 && (
          <div className="mb-8">
            <h2 className="font-heading font-bold text-lg mb-4">My Listings ({userListings.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userListings.map(listing => (
                <div key={listing.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedListing(listing)}>
                  <div className="h-40 bg-secondary relative overflow-hidden">
                    {listing.photo_urls?.[0] ? <img src={listing.photo_urls[0]} alt="" className="h-full w-full object-cover" /> : <div className="h-full flex items-center justify-center text-muted-foreground"><Camera className="h-8 w-8" /></div>}
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="font-bold text-lg">{listing.car_year} {listing.car_make} {listing.car_model}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><Gauge className="h-3 w-3" /> {listing.odometer?.toLocaleString()} km</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {listing.suburb}, {listing.state}</p>
                    <p className="font-heading font-bold text-lg text-accent">${listing.asking_price?.toLocaleString()}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {listing.views_count || 0}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {listing.inquiries_count || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h2 className="font-heading font-bold text-xl mb-4">Browse Listings</h2>
            <div className="relative mb-4 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search cars..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 bg-secondary/50 border-0 text-sm" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No listings found. Be the first to list your car!</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map(listing => (
                <motion.div key={listing.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setSelectedListing(listing)}>
                  <div className="h-40 bg-secondary relative overflow-hidden">
                    {listing.photo_urls?.[0] ? <img src={listing.photo_urls[0]} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform" /> : <div className="h-full flex items-center justify-center text-muted-foreground"><Camera className="h-8 w-8" /></div>}
                    {listing.price_verdict && (
                      <div className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-lg font-semibold ${listing.price_verdict === "great_deal" ? "bg-emerald-500 text-white" : listing.price_verdict === "fair" ? "bg-blue-500 text-white" : "bg-amber-500 text-white"}`}>
                        {listing.price_verdict.replace("_", " ")}
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="font-bold text-lg">{listing.car_year} {listing.car_make} {listing.car_model}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {listing.suburb}, {listing.state}</p>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-muted-foreground">Asking</p>
                        <p className="font-heading font-bold text-lg text-accent">${listing.asking_price?.toLocaleString()}</p>
                      </div>
                      {listing.market_price_average && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Market Avg</p>
                          <p className="font-heading font-bold text-lg text-emerald-600">${listing.market_price_average?.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p className="flex items-center gap-1"><Gauge className="h-3 w-3" /> {listing.odometer?.toLocaleString()} km • {listing.transmission || "Unknown"}</p>
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {listing.views_count || 0}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {listing.inquiries_count || 0}</span>
                    </div>
                    <Button size="sm" className="w-full h-8 bg-primary/10 text-primary hover:bg-primary/20 gap-1 text-xs">
                      View Details <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {selectedListing && (
          <ListingDetailModal listing={selectedListing} onClose={() => setSelectedListing(null)} />
        )}
      </div>
    </div>
  );
}