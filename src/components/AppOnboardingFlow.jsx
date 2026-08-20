import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, ShieldCheck, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { TERMS_VERSION, PRIVACY_POLICY_VERSION } from '@/lib/legalVersions';

export default function AppOnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(1); // 1: privacy+terms, 2: email OTP verification, 3: location
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedMarketing, setAcceptedMarketing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [profileForm, setProfileForm] = useState({ suburb: "", state: "", phone: "" });
  const [installSource, setInstallSource] = useState('web');
  const [notifPermission, setNotifPermission] = useState(null); // null | 'granted' | 'denied'
  const navigate = useNavigate();

  useEffect(() => {
    if (window.navigator.standalone === true) setInstallSource('ios');
    else if (window.matchMedia('(display-mode: standalone)').matches) setInstallSource('pwa');
    else if (navigator.userAgent.includes('Android')) setInstallSource('android');
    else setInstallSource('web');
    base44.auth.me().then(u => setUserEmail(u?.email || "")).catch(() => {});
  }, []);

  const sendOtp = async (isResend = false) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('sendSignupOtp', {});
      if (res.data?.already_verified) {
        setStep(3);
        return;
      }
      setStep(2);
      toast.success(isResend ? 'New code sent.' : 'Verification code sent to your email.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('verifySignupOtp', { otp });
      if (res.data?.success) {
        if (res.data.credit_granted) toast.success('Email verified — your free credit has been added!');
        else toast.success('Email verified.');
        setStep(3);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!acceptedTerms) {
        toast.error('Please accept the Privacy Policy and Terms of Service to continue.');
        return;
      }
      sendOtp(); // verify email before granting the free credit
    }
  };

  const handleRequestNotifications = () => {
    // Must call requestPermission synchronously within the user gesture handler
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then(() => {
        finishOnboarding();
      }).catch(() => {
        finishOnboarding();
      });
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke('recordUserAcceptances', {
        privacy_policy_accepted: true,
        terms_accepted: true,
        privacy_policy_version: PRIVACY_POLICY_VERSION,
        terms_version: TERMS_VERSION,
        camera_permission: 'pending',
        install_source: installSource,
        marketing_emails: acceptedMarketing,
      });
      localStorage.setItem(`legal_accepted_${TERMS_VERSION}_${PRIVACY_POLICY_VERSION}`, '1');
      await base44.auth.updateMe({
        terms_accepted: true,
        suburb: profileForm.suburb,
        state: profileForm.state,
        marketing_emails_accepted: acceptedMarketing,
      });
      localStorage.setItem('onboarding_completed', 'true');
      onComplete();
      navigate('/');
    } catch (err) {
      toast.error('Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  const handleConsumerSignup = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke('recordUserAcceptances', {
        privacy_policy_accepted: true,
        terms_accepted: true,
        privacy_policy_version: PRIVACY_POLICY_VERSION,
        terms_version: TERMS_VERSION,
        camera_permission: 'pending',
        install_source: installSource,
        marketing_emails: acceptedMarketing,
      });
      localStorage.setItem(`legal_accepted_${TERMS_VERSION}_${PRIVACY_POLICY_VERSION}`, '1');
      await base44.auth.updateMe({ 
        terms_accepted: true, 
        marketing_emails_accepted: acceptedMarketing,
        suburb: profileForm.suburb,
        state: profileForm.state,
        phone: profileForm.phone || undefined,
      });
      localStorage.setItem('onboarding_completed', 'true');
      onComplete();
      navigate('/');
    } catch (err) {
      toast.error('Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent p-6 text-white">
          <h1 className="font-heading font-bold text-2xl mb-1">Welcome to ServCheck</h1>
          <p className="text-sm text-white/80">Australia's #1 mechanic quote checker</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Step 1: Privacy & Terms */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Before we get started, please review and accept our policies.</p>

              {/* Required: Terms & Privacy */}
              <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Required</p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="rounded border-slate-300 mt-0.5 flex-shrink-0 accent-orange-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      I agree to the{" "}
                      <Link to="/terms" target="_blank" className="text-accent underline" onClick={(e) => e.stopPropagation()}>Terms of Service</Link>
                      {" "}and{" "}
                      <Link to="/privacy" target="_blank" className="text-accent underline" onClick={(e) => e.stopPropagation()}>Privacy Policy</Link>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Required to use ServCheck</p>
                  </div>
                </label>
              </div>

              {/* Optional: Marketing emails */}
              <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Optional</p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedMarketing}
                    onChange={(e) => setAcceptedMarketing(e.target.checked)}
                    className="rounded border-slate-300 mt-0.5 flex-shrink-0 accent-orange-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">Receive tips, deals & pricing alerts via email</p>
                    <p className="text-xs text-slate-500 mt-0.5">We'll send occasional helpful updates. Unsubscribe anytime.</p>
                  </div>
                </label>
              </div>
            </div>
          )}



          {/* Step 2: Email OTP verification */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground">Verify your email</p>
              <p className="text-xs text-slate-500">
                We sent a 6-digit code to <span className="font-semibold text-slate-700">{userEmail}</span>.
                Enter it below to confirm your account and claim your free credit.
              </p>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                placeholder="123456"
                className="h-12 text-center text-xl tracking-[0.4em] font-bold"
              />
              <button
                type="button"
                onClick={() => sendOtp(true)}
                disabled={loading}
                className="text-xs text-accent underline font-medium"
              >
                Didn't get it? Resend code
              </button>
            </div>
          )}

          {/* Step 3: Consumer Location + Phone */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground">Where are you located?</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Suburb</label>
                  <Input
                    value={profileForm.suburb}
                    onChange={e => setProfileForm(p => ({ ...p, suburb: e.target.value }))}
                    placeholder="e.g. Auburn"
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">State</label>
                  <select
                    value={profileForm.state}
                    onChange={e => setProfileForm(p => ({ ...p, state: e.target.value }))}
                    className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select</option>
                    {["NSW","VIC","QLD","WA","SA","TAS","ACT","NT"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional phone number */}
              <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Optional</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-800">Phone number</label>
                  <p className="text-xs text-slate-500">If you provide your number, mechanics who claim your lead can call you directly for faster service.</p>
                  <Input
                    type="tel"
                    value={profileForm.phone}
                    onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="e.g. 0412 345 678"
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100">
          {step === 1 && (
            <Button
              onClick={handleNextStep}
              disabled={!acceptedTerms || loading}
              className="w-full h-10 bg-accent text-white font-semibold text-sm hover:bg-accent/90"
            >
              {loading ? "Sending code..." : "Continue"}
            </Button>
          )}

          {step === 2 && (
            <Button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              className="w-full h-10 bg-accent text-white font-semibold text-sm hover:bg-accent/90"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </Button>
          )}

          {step === 3 && (
            <Button
              onClick={handleConsumerSignup}
              disabled={loading || !profileForm.state}
              className="w-full h-10 bg-accent text-white font-semibold text-sm hover:bg-accent/90"
            >
              {loading ? "Setting up..." : "Get Started"}
            </Button>
          )}
        </div>
      </div>

    </div>
  );
}