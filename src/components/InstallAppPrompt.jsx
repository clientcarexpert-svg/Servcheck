import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, Share, PlusSquare } from "lucide-react";

const DISMISS_KEY = "servcheck_install_dismissed";

export default function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [visible, setVisible] = useState(false);

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  useEffect(() => {
    if (isStandalone || localStorage.getItem(DISMISS_KEY)) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    setVisible(true);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleYes = async () => {
    if (deferredPrompt) {
      // Android / Chrome — triggers the native install automatically
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        localStorage.setItem(DISMISS_KEY, "1");
        setVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      // iOS — Apple doesn't allow automatic install; show the 2 taps needed
      setShowIosSteps(true);
    }
  };

  const handleNo = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">Add ServCheck to your home screen?</p>
          {showIosSteps ? (
            <div className="mt-2 text-xs text-foreground space-y-1.5 bg-secondary rounded-lg p-3">
              <p className="flex items-center gap-1.5">
                1. Tap <Share className="w-3.5 h-3.5 inline text-accent" /> <strong>Share</strong> at the bottom of Safari
              </p>
              <p className="flex items-center gap-1.5">
                2. Tap <PlusSquare className="w-3.5 h-3.5 inline text-accent" /> <strong>Add to Home Screen</strong>
              </p>
            </div>
          ) : (
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleYes} className="bg-accent hover:bg-accent/90 text-accent-foreground px-6">
                Yes
              </Button>
              <Button size="sm" variant="outline" onClick={handleNo} className="px-6">
                No
              </Button>
            </div>
          )}
        </div>
        {showIosSteps && (
          <button onClick={handleNo} className="text-xs text-muted-foreground hover:text-foreground shrink-0 underline">
            Done
          </button>
        )}
      </div>
    </div>
  );
}