import { useState, useEffect } from "react";
import { checkAndFireFollowUpNotification, initPushOnInstall, requestNotificationPermissionSilently } from "@/lib/notifications";
import PricingReadyPoller from "./PricingReadyPoller";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { syncCreditsFromDB } from "@/lib/credits";
import AppOnboardingFlow from "./AppOnboardingFlow";
import LegalUpdateBanner from "./LegalUpdateBanner";
import { Outlet, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { History, Users, Car, Home, Settings, UserCircle, BookOpen, Wrench, ShieldCheck, Store, MessageSquare, NotebookText, Gift, HelpCircle, MoreHorizontal, X, Menu, Zap, Share2, Mail, Info } from "lucide-react";
import { toast } from "sonner";
import SettingsSheet from "./SettingsSheet";
import MechanicSettingsSheet from "./MechanicSettingsSheet";
import CreditsBar from "./CreditsBar";
import ReferralModal from "./ReferralModal";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";


// Primary bottom tabs (always visible)
const PRIMARY_TABS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/check-quote", icon: Wrench, label: "Check" },
  { to: "/logbook", icon: NotebookText, label: "Logbook" },
  { to: "/buy-car", icon: Car, label: "Buyer Tool" },
  { to: "/my-requests", icon: MessageSquare, label: "Messages" },
];

// Extra tabs shown in "More" drawer
const MORE_TABS = [
  // HIDDEN: { to: "/marketplace", icon: Store, label: "Marketplace" },
  { to: "/history", icon: History, label: "History" },
  { to: "/community", icon: Users, label: "Community" },
  { to: "/directory", icon: BookOpen, label: "Directory" },
  { to: "/faq", icon: HelpCircle, label: "FAQ" },
];

// Admin tabs
const ADMIN_TABS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/check-quote", icon: Wrench, label: "Check" },
  { to: "/logbook", icon: NotebookText, label: "Logbook" },
  { to: "/buy-car", icon: Car, label: "Buyer Tool" },
  { to: "/admin", icon: ShieldCheck, label: "Admin" },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [showAppOnboarding, setShowAppOnboarding] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [settingsDefaultSection, setSettingsDefaultSection] = useState(null);
  const [guestActiveBtn, setGuestActiveBtn] = useState('login'); // 'login' | 'business'

  useEffect(() => {
    if (user) {
      syncCreditsFromDB();
    }
  }, [user]);

  useEffect(() => {
    if (!isLoadingAuth && user && !user.terms_accepted) {
      const isMechanic = user.role === 'mechanic' || user.role === 'mobile_mechanic';
      const isDealer = user.role === 'dealer';
      const isAdmin = user.role === 'admin';
      const mechIntent = localStorage.getItem('signup_intent') === 'mechanic';

      if (isMechanic || isDealer || isAdmin) return;

      // If they came via "List your business", redirect to mechanic signup instead of consumer onboarding
      if (mechIntent) {
        localStorage.removeItem('signup_intent');
        navigate('/mechanic-signup');
        return;
      }

      setShowAppOnboarding(true);
    }
  }, [user, isLoadingAuth]);

  useEffect(() => {
    initPushOnInstall();
    // Also request silently for logged-in users so message notifications work
    requestNotificationPermissionSilently();
  }, []);

  // Global unread message count + push notifications when mechanic replies
  const unreadMessages = useUnreadMessages(user);

  useEffect(() => {
    const handler = () => setReferralOpen(true);
    window.addEventListener("open-referral", handler);
    return () => window.removeEventListener("open-referral", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      setSettingsDefaultSection(e.detail?.tab || null);
      setSettingsOpen(true);
    };
    window.addEventListener("open-mechanic-settings", handler);
    return () => window.removeEventListener("open-mechanic-settings", handler);
  }, []);

  useEffect(() => {
    checkAndFireFollowUpNotification();
    const interval = setInterval(checkAndFireFollowUpNotification, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const isGuest = !user;
  // Treat anyone on mechanic-portal as a mechanic (safety net if role didn't sync yet)
  const isOnMechanicRoute = location.pathname.startsWith('/mechanic-portal');
  const isMechanic = user?.role === 'mechanic' || user?.role === 'mobile_mechanic' || (!!user && isOnMechanicRoute);
  const isDealer = user?.role === 'dealer';
  const isAdmin = user?.role === 'admin';
  const isRegularUser = !isMechanic && !isDealer && !isAdmin && user;

  const isSignupFlow = ['/mechanic-signup', '/dealer-signup', '/partner-signup'].includes(location.pathname);
  // Don't block mechanic-signup with consumer onboarding
  const effectiveShowOnboarding = showAppOnboarding && !isSignupFlow;
  const hasCompletedOnboarding = !isLoadingAuth && !effectiveShowOnboarding;

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect mechanics from home BEFORE rendering — prevents flash of user UI
  if (isMechanic && location.pathname === '/') {
    return <Navigate to="/mechanic-portal" replace />;
  }

  return (
    <div>
      {effectiveShowOnboarding && user && !user.terms_accepted && (
        <AppOnboardingFlow onComplete={() => setShowAppOnboarding(false)} />
      )}

      {/* One-time banner for existing users to accept updated legal documents */}
      {!effectiveShowOnboarding && user && user.terms_accepted && (
        <LegalUpdateBanner user={user} />
      )}

      {/* Fixed header */}
      {!effectiveShowOnboarding && (
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, height: "60px", zIndex: 100 }} className="bg-white border-b border-slate-100 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Link
            to={isMechanic ? '/mechanic-portal' : isDealer ? '/dealer-dashboard' : '/'}
            className="flex items-center gap-2"
          >
            <img src="https://media.base44.com/images/public/69c3e608178c08315713aa79/d1f539b4e_generated_image.png" alt="ServCheck" loading="lazy" className="h-8 w-8 object-contain flex-shrink-0" />
            <span className="font-heading font-bold text-xl tracking-tight text-[#1a237e]">Serv<span className="text-[#f97316]">Check</span></span>
          </Link>
        </div>

        <div className="flex items-center gap-2">


          {/* Regular user: credits + profile */}
          {isRegularUser && hasCompletedOnboarding && !isSignupFlow && <CreditsBar />}
          {isRegularUser && hasCompletedOnboarding && !isSignupFlow && (
            <Link
              to="/profile"
              className="h-10 w-10 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <UserCircle className="h-5 w-5" />
            </Link>
          )}

          {/* Guest: styled pill box with List your business | Login as user */}
          {isGuest && (
            <div className="flex items-center rounded-xl overflow-hidden border border-[#f97316] shadow-sm bg-white">
              <Link
                to="/mechanic-signup"
                onClick={() => localStorage.setItem('signup_intent', 'mechanic')}
                className="text-xs font-bold px-3 py-2 whitespace-nowrap bg-[#f97316] text-white hover:bg-[#ea6c0a] transition-colors"
              >
                List your business
              </Link>
              <div className="w-px h-5 bg-white/40" />
              <button
                onClick={() => base44.auth.redirectToLogin(window.location.href)}
                className="text-xs font-bold px-3 py-2 whitespace-nowrap bg-[#f97316] text-white hover:bg-[#ea6c0a] transition-colors"
              >
                Login as user
              </button>
            </div>
          )}

          {/* Hamburger Menu: only after onboarding for logged-in users, never during signup flows */}
          {!isGuest && hasCompletedOnboarding && !isSignupFlow && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              onKeyDown={(e) => { if (e.key === "Escape") setMenuOpen(false); }}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="h-10 w-10 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-accent focus:outline-none"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </header>
      )}

      {/* Hamburger Menu Dropdown — Mechanic */}
      {!effectiveShowOnboarding && isMechanic && hasCompletedOnboarding && menuOpen && (
        <div style={{ position: "fixed", top: "60px", right: 0, zIndex: 99 }} className="bg-white border-l border-b border-slate-100 shadow-lg rounded-bl-2xl w-64">
          <div className="p-3 space-y-1">
            <Link
              to="/mechanic-portal"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <Home className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">Home</span>
            </Link>
            <Link
              to="/mechanic-portal?tab=profile"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <UserCircle className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">My Profile</span>
            </Link>
            <button
              onClick={() => { setMenuOpen(false); setSettingsOpen(true); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <Settings className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">Subscription & Settings</span>
            </button>
            <div className="border-t border-slate-100 my-1" />
            <Link
              to="/faq"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <HelpCircle className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">FAQ</span>
            </Link>
            <button
              onClick={() => { setMenuOpen(false); toast.info("Coming soon."); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <Mail className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">Contact Support</span>
            </button>
            <Link
              to="/faq#about-servcheck"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <Info className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">About ServCheck</span>
            </Link>
            <Link
              to="/privacy"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">Privacy Policy</span>
            </Link>
            <Link
              to="/partner-terms"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">Partner Terms of Service</span>
            </Link>
            <div className="border-t border-slate-100 my-1" />
            <button
              onClick={() => { setMenuOpen(false); base44.auth.logout(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-left text-red-600"
            >
              <X className="h-4 w-4" />
              <span className="text-sm font-semibold">Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Hamburger Menu Dropdown — Regular User / Admin */}
      {!effectiveShowOnboarding && !isGuest && !isMechanic && hasCompletedOnboarding && menuOpen && (
        <div style={{ position: "fixed", top: "60px", right: 0, zIndex: 99 }} className="bg-white border-l border-b border-slate-100 shadow-lg rounded-bl-2xl w-64">
          <div className="p-3 space-y-1">
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <Car className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">My Cars</span>
            </Link>
            <button
              onClick={() => { setMenuOpen(false); setSettingsOpen(true); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <Settings className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">Settings</span>
            </button>
            {isRegularUser && (
              <button
                onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent("open-referral")); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-left"
              >
                <Share2 className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold">Refer a Friend</span>
              </button>
            )}
            <div className="border-t border-slate-100 my-1" />
            <Link to="/faq" onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-left">
              <HelpCircle className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">FAQ</span>
            </Link>
            <button onClick={() => { setMenuOpen(false); toast.info("Coming soon."); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-left">
              <Mail className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">Contact Support</span>
            </button>
            <Link to="/faq#about-servcheck" onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-left">
              <Info className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">About ServCheck</span>
            </Link>
            <Link to="/privacy" onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-left">
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">Privacy Policy</span>
            </Link>
            <Link to="/terms" onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-left">
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">Terms of Service</span>
            </Link>
            {isAdmin && (
              <>
                <div className="border-t border-slate-100 my-1" />
                <Link to="/admin" onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-left">
                  <ShieldCheck className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold">Admin Panel</span>
                </Link>
              </>
            )}
            <div className="border-t border-slate-100 my-1" />
            <button onClick={() => { setMenuOpen(false); base44.auth.logout(); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-left text-red-600">
              <X className="h-4 w-4" />
              <span className="text-sm font-semibold">Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Page content */}
      {!effectiveShowOnboarding && (
      <div style={{ paddingTop: "60px", paddingBottom: (isRegularUser || isAdmin) && hasCompletedOnboarding && !isSignupFlow ? "72px" : "24px" }}>
        <Outlet />
      </div>
      )}

      {/* Bottom Tab Bar — regular users */}
      {!effectiveShowOnboarding && isRegularUser && hasCompletedOnboarding && !isSignupFlow && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100 }} aria-label="Main navigation" className="bg-white border-t border-slate-100 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] flex items-center justify-around px-2 h-[72px]">
          {PRIMARY_TABS.map(({ to, icon: TabIcon, label }) => {
            const active = location.pathname === to;
            const showBadge = to === "/my-requests" && unreadMessages > 0;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMoreOpen(false)}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-1 flex-1 py-2 focus:ring-2 focus:ring-accent rounded-lg focus:outline-none"
              >
                <div className={`relative h-8 w-8 rounded-xl flex items-center justify-center transition-colors ${active ? "bg-[#f97316]" : "bg-transparent"}`}>
                  <TabIcon className={`h-5 w-5 ${active ? "text-white" : "text-[#0A0F2C]"}`} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold ${active ? "text-[#f97316]" : "text-[#0A0F2C]"}`}>{label}</span>
              </Link>
            );
          })}
          {/* More button */}
           <button
             onClick={() => setMoreOpen(o => !o)}
             aria-label="More options"
             aria-expanded={moreOpen}
             className="flex flex-col items-center gap-1 flex-1 py-2 focus:ring-2 focus:ring-accent rounded-lg focus:outline-none"
           >
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors ${moreOpen ? "bg-[#f97316]" : "bg-transparent"}`}>
              {moreOpen ? <X className={`h-5 w-5 text-white`} /> : <MoreHorizontal className={`h-5 w-5 text-[#0A0F2C]`} />}
            </div>
            <span className={`text-[10px] font-bold ${moreOpen ? "text-[#f97316]" : "text-[#0A0F2C]"}`}>More</span>
          </button>
        </nav>
      )}

      {/* "More" drawer for regular users */}
      {!effectiveShowOnboarding && isRegularUser && hasCompletedOnboarding && !isSignupFlow && moreOpen && (
        <div
          style={{ position: "fixed", bottom: "72px", left: 0, right: 0, zIndex: 99 }}
          className="bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] rounded-t-2xl px-4 pt-4 pb-4"
        >
          <div className="grid grid-cols-3 gap-3">
            {MORE_TABS.map(({ to, icon: TabIcon, label }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className={`flex flex-col items-center gap-2 rounded-2xl p-3 transition-colors ${active ? "bg-orange-50" : "bg-slate-50 hover:bg-slate-100"}`}
                >
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${active ? "bg-[#f97316]" : "bg-white"} shadow-sm`}>
                    <TabIcon className={`h-5 w-5 ${active ? "text-white" : "text-slate-500"}`} />
                  </div>
                  <span className={`text-xs font-bold ${active ? "text-[#f97316]" : "text-slate-600"}`}>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Tab Bar — admin */}
      {!effectiveShowOnboarding && isAdmin && hasCompletedOnboarding && !isSignupFlow && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100 }} className="bg-white border-t border-slate-100 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] flex items-center justify-around px-2 h-[72px]">
          {ADMIN_TABS.map(({ to, icon: TabIcon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center gap-1 flex-1 py-2"
              >
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors ${active ? "bg-[#f97316]" : "bg-transparent"}`}>
                  <TabIcon className={`h-5 w-5 ${active ? "text-white" : "text-slate-900"}`} />
                </div>
                <span className={`text-[10px] font-bold ${active ? "text-[#f97316]" : "text-slate-900"}`}>{label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {isMechanic
        ? <MechanicSettingsSheet open={settingsOpen} defaultSection={settingsDefaultSection} onClose={() => { setSettingsOpen(false); setMenuOpen(false); setSettingsDefaultSection(null); }} />
        : <SettingsSheet open={settingsOpen} onClose={() => { setSettingsOpen(false); setMenuOpen(false); }} />
      }
      {referralOpen && <ReferralModal onClose={() => setReferralOpen(false)} />}
      <PricingReadyPoller />
      
      {/* Close menu on navigation */}
      {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />}


    </div>
  );
}