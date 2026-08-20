import { useState, useEffect } from "react";
import SEOHead from "../components/SEOHead";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Eye, TrendingUp, Star, Wrench, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function WorkshopDashboard() {
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      setEmail(user.email);
      const all = await base44.entities.Workshop.filter({ user_email: user.email });
      setWorkshop(all[0] || null);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  if (!workshop) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <Wrench className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-40" />
      <h2 className="font-heading font-bold text-xl mb-2">No workshop listed yet</h2>
      <p className="text-muted-foreground mb-6">List your workshop for free to start receiving visibility from local drivers.</p>
      <Link to="/partner-signup">
        <Button className="bg-accent text-white font-semibold">List My Workshop →</Button>
      </Link>
    </div>
  );

  const isPro = workshop.subscription_tier === "pro";

  const handleUpgrade = async () => {
    if (window.self !== window.top) {
      alert('Checkout is only available from the published app, not inside the editor preview.');
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await base44.functions.invoke('createProCheckout', { workshop_id: workshop.id });
      window.location.href = res.data.url;
    } catch (err) {
      alert('Could not start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <SEOHead title="Workshop Dashboard" description="Your workshop dashboard." path="/workshop-dashboard" noindex={true} />
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-heading font-bold text-2xl mb-1">{workshop.business_name}</h1>
        <p className="text-muted-foreground text-sm">{workshop.suburb}, {workshop.state}</p>
      </motion.div>

      {/* Views metric */}
      <motion.div
       initial={{ opacity: 0, scale: 0.97 }}
       animate={{ opacity: 1, scale: 1 }}
       transition={{ delay: 0.1 }}
       className="rounded-2xl bg-primary text-primary-foreground p-8 text-center mb-6"
      >
       <Eye className="h-8 w-8 mx-auto mb-3 opacity-70" />
       <p className="text-6xl font-heading font-bold mb-2">{workshop.profile_views || 0}</p>
       <p className="text-primary-foreground/80 text-lg">Drivers viewed your profile</p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Current Plan</p>
          <p className={`font-heading font-bold text-xl ${isPro ? "text-amber-600" : "text-foreground"}`}>
            {isPro ? "Premium Shop" : "Free"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Specialties</p>
          <p className="font-heading font-bold text-xl">{workshop.specialties?.length || 0}</p>
        </div>
      </div>

      {/* Specialties */}
      {workshop.specialties?.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Your Specialties</p>
          <div className="flex flex-wrap gap-2">
            {workshop.specialties.map(s => (
              <span key={s} className="text-sm bg-secondary text-foreground px-3 py-1 rounded-full font-medium">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Upsell (if free) */}
      {!isPro && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-white p-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
             <h3 className="font-heading font-bold text-lg text-amber-800">Upgrade to Premium Shop</h3>
            </div>
          <ul className="text-sm text-amber-900 space-y-1.5 mb-5">
            <li>Gold-highlighted card — stand out above free listings</li>
             <li>Prominent call button shown to all visitors</li>
             <li>Verified ABN badge displayed on your card</li>
             <li>Specialty tags shown to attract customers</li>
             <li>Priority placement above all free listings</li>
            </ul>
          <div className="flex items-end gap-2 mb-4">
            <span className="font-heading font-bold text-3xl text-amber-800">$39</span>
            <span className="text-amber-700 mb-1">/month</span>
          </div>
          <Button className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-heading font-semibold" onClick={handleUpgrade} disabled={checkoutLoading}>
            {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
            {checkoutLoading ? 'Redirecting...' : 'Upgrade to Premium — $39/month'}
          </Button>
          <p className="text-xs text-amber-700 text-center mt-3">Cancel anytime. No lock-in contracts.</p>
        </motion.div>
      )}

      {isPro && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-center">
          <p className="text-emerald-700 font-semibold">Your Premium Shop listing is highlighted above all free listings.</p>
        </div>
      )}
    </div>
  );
}