import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { FocusVisibleProvider } from '@/components/FocusVisibleProvider';
import Layout from './components/Layout';
import LazyLoadFallback from '@/components/LazyLoadFallback';
import '@/lib/installPrompt'; // capture install prompt event early

// Frequently used pages (eager load)
import Home from './pages/Home.jsx';
import CheckQuote from './pages/CheckQuote';
import Profile from './pages/Profile';
import FAQ from './pages/FAQ';

// Lazy-loaded pages (code-split)
const Results = lazy(() => import('./pages/Results'));
const History = lazy(() => import('./pages/History'));
const Community = lazy(() => import('./pages/Community'));
const BuyCar = lazy(() => import('./pages/BuyCar'));
const Mechanics = lazy(() => import('./pages/Mechanics'));
const Logbook = lazy(() => import('./pages/Logbook'));
const Admin = lazy(() => import('./pages/Admin'));
const MechanicDirectory = lazy(() => import('./pages/MechanicDirectory'));
const PartnerSignup = lazy(() => import('./pages/PartnerSignup'));
const LocalAlternatives = lazy(() => import('./pages/LocalAlternatives'));
const WorkshopDashboard = lazy(() => import('./pages/WorkshopDashboard'));
const MechanicSignup = lazy(() => import('./pages/MechanicSignup'));
const MechanicPortal = lazy(() => import('./pages/MechanicPortal'));
// HIDDEN: Marketplace page (re-enable by uncommenting import + route)
// const Marketplace = lazy(() => import('./pages/Marketplace'));
const MyRequests = lazy(() => import('./pages/MyRequests'));
const MyDiagnosticRequests = lazy(() => import('./pages/MyDiagnosticRequests'));
const MobileDiagnosticRequest = lazy(() => import('./pages/MobileDiagnosticRequest'));
const Messages = lazy(() => import('./pages/Messages'));
const EstimateResult = lazy(() => import('./pages/EstimateResult'));
const VsCompetitor = lazy(() => import('./pages/VsCompetitor'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PartnerTerms = lazy(() => import('./pages/PartnerTerms'));
const SymptomChecker = lazy(() => import('./pages/SymptomChecker'));

import RoleGuard from './components/RoleGuard';
import { COMPETITORS } from '@/lib/competitors';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Allow guests through — they'll see the public landing page
      // Do NOT redirect to login automatically
    }
  }

  // Render the main app
  return (
    <Suspense fallback={<LazyLoadFallback />}>
      <Routes>
        {/* Public competitor landing pages (SEO) */}
        {COMPETITORS.map(({ slug, name }) => (
          <Route key={slug} path={`/vs/${slug}`} element={<VsCompetitor competitor={name} slug={slug} />} />
        ))}

        <Route element={<Layout />}>
          {/* Home page — accessible to all authenticated roles */}
          <Route path="/" element={<Home />} />
          <Route path="/results" element={<RoleGuard allowed={['user']}><Results /></RoleGuard>} />
          <Route path="/history" element={<RoleGuard allowed={['user']}><History /></RoleGuard>} />
          <Route path="/community" element={<RoleGuard allowed={['user']}><Community /></RoleGuard>} />
          <Route path="/buy-car" element={<RoleGuard allowed={['user']}><BuyCar /></RoleGuard>} />
          <Route path="/mechanics" element={<RoleGuard allowed={['user']}><Mechanics /></RoleGuard>} />
          <Route path="/logbook" element={<RoleGuard allowed={['user']}><Logbook /></RoleGuard>} />
          <Route path="/profile" element={<RoleGuard allowed={['user']}><Profile /></RoleGuard>} />
          <Route path="/directory" element={<RoleGuard allowed={['user']}><MechanicDirectory /></RoleGuard>} />
          <Route path="/partner-signup" element={<RoleGuard allowed={['user']}><PartnerSignup /></RoleGuard>} />
          <Route path="/local-alternatives" element={<RoleGuard allowed={['user']}><LocalAlternatives /></RoleGuard>} />
          <Route path="/workshop-dashboard" element={<RoleGuard allowed={['user']}><WorkshopDashboard /></RoleGuard>} />

          {/* Signup flows — open to unassigned roles only */}
          <Route path="/mechanic-signup" element={<MechanicSignup />} />

          {/* Mechanic-only routes (admins can view too) */}
          <Route path="/mechanic-portal" element={<RoleGuard allowed={['mechanic', 'mobile_mechanic', 'admin']}><MechanicPortal /></RoleGuard>} />
          {/* HIDDEN: <Route path="/marketplace" element={<RoleGuard allowed={['user']}><Marketplace /></RoleGuard>} /> */}

          {/* Admin-only */}
          <Route path="/admin" element={<RoleGuard allowed={['admin']}><Admin /></RoleGuard>} />

          {/* Check Quote — open to guests + users only; mechanics redirected to their portal */}
          <Route path="/check-quote" element={<CheckQuote />} />
          <Route path="/estimate-result" element={<RoleGuard allowed={['user']}><EstimateResult /></RoleGuard>} />
          <Route path="/my-requests" element={<RoleGuard allowed={['user']}><Messages /></RoleGuard>} />
          <Route path="/my-diagnostic-requests" element={<RoleGuard allowed={['user']}><MyDiagnosticRequests /></RoleGuard>} />
          <Route path="/mobile-diagnostic-request" element={<RoleGuard allowed={['user']}><MobileDiagnosticRequest /></RoleGuard>} />
          <Route path="/symptom-checker" element={<SymptomChecker />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/partner-terms" element={<PartnerTerms />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <FocusVisibleProvider />
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App