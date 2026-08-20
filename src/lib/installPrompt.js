// Captures the browser's install prompt event globally (it fires once, early,
// before lazy-loaded pages mount) so results pages can trigger it later.
let deferredPrompt = null;
let installed = false;
const listeners = new Set();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    listeners.forEach((fn) => fn());
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferredPrompt = null;
    listeners.forEach((fn) => fn());
  });
}

export function getDeferredPrompt() {
  return deferredPrompt;
}

export function wasInstalled() {
  return installed;
}

export function clearDeferredPrompt() {
  deferredPrompt = null;
}

export function onInstallStateChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}