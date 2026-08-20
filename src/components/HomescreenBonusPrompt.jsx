import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Smartphone, Share, PlusSquare, Gift } from "lucide-react";
import GiftBoxReveal from "@/components/GiftBoxReveal";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getDeferredPrompt, clearDeferredPrompt, isStandalone } from "@/lib/installPrompt";

const CLAIMED_KEY = "servcheck_hs_bonus_claimed";

export default function HomescreenBonusPrompt() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState("offer"); // offer | ios_steps | claim | done
  const [claiming, setClaiming] = useState(false);

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(CLAIMED_KEY)) return;
    base44.auth.me().then((user) => {
      if (user && !user.homescreen_bonus_claimed) setVisible(true);
    }).catch(() => {});
  }, []);

  const handleAdd = async () => {
    const deferred = getDeferredPrompt();
    if (deferred) {
      // Android / Chrome — native install prompt
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      clearDeferredPrompt();
      if (outcome === "accepted") setStep("claim");
    } else {
      // iOS (or no native prompt available) — show manual steps
      setStep("ios_steps");
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await base44.functions.invoke("claimHomescreenBonus", {});
      if (res.data?.success) {
        localStorage.setItem(CLAIMED_KEY, "1");
        localStorage.setItem("servcheck_credits", String(res.data.credits));
        window.dispatchEvent(new Event("credits-updated"));
        setStep("done");
        toast.success("5 free credits added!");
      } else if (res.data?.already_claimed) {
        localStorage.setItem(CLAIMED_KEY, "1");
        setVisible(false);
      } else {
        toast.error("Could not claim your bonus. Please try again.");
      }
    } catch {
      toast.error("Could not claim your bonus. Please try again.");
    } finally {
      setClaiming(false);
    }
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-5"
    >
      {step === "done" ? (
        <GiftBoxReveal amount={5}>
          <p className="font-heading font-bold text-sm text-foreground">Why not go another round? This one's on us</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            5 credits are now on your account — your next check is on the house. Next time a mechanic
            hands you a quote, just tap the ServCheck icon on your home screen and we'll be here,
            credits ready and waiting.
          </p>
        </GiftBoxReveal>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
              <Gift className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-sm text-foreground">Add to home screen — get 5 free credits</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quotes don't wait, and neither should you. Put ServCheck one tap away and we'll gift you a full check on us.
              </p>
            </div>
          </div>

          {step === "offer" && (
            <Button
              onClick={handleAdd}
              className="mt-3 w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 h-11"
            >
              <Smartphone className="h-4 w-4" />
              Add to Home Screen
            </Button>
          )}

          {step === "ios_steps" && (
            <div className="mt-3 space-y-3">
              <div className="text-xs text-foreground space-y-1.5 bg-secondary rounded-xl p-3">
                {isIos ? (
                  <>
                    <p className="flex items-center gap-1.5">
                      1. Tap <Share className="w-3.5 h-3.5 inline text-accent" /> <strong>Share</strong> at the bottom of Safari
                    </p>
                    <p className="flex items-center gap-1.5">
                      2. Tap <PlusSquare className="w-3.5 h-3.5 inline text-accent" /> <strong>Add to Home Screen</strong>
                    </p>
                    <p className="flex items-center gap-1.5">3. Tap <strong>Add</strong> in the top corner</p>
                  </>
                ) : (
                  <>
                    <p>1. Open your browser menu (⋮)</p>
                    <p className="flex items-center gap-1.5">
                      2. Tap <PlusSquare className="w-3.5 h-3.5 inline text-accent" /> <strong>Add to Home Screen</strong> / <strong>Install App</strong>
                    </p>
                  </>
                )}
              </div>
              <Button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 h-11"
              >
                {claiming ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Claiming…</>
                ) : (
                  <><Gift className="h-4 w-4" /> I've added it — Claim 5 credits</>
                )}
              </Button>
            </div>
          )}

          {step === "claim" && (
            <Button
              onClick={handleClaim}
              disabled={claiming}
              className="mt-3 w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700 h-11"
            >
              {claiming ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Claiming…</>
              ) : (
                <><Gift className="h-4 w-4" /> Claim your 5 credits</>
              )}
            </Button>
          )}
        </>
      )}
    </motion.div>
  );
}