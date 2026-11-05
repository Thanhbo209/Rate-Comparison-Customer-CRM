const COLLAPSE_KEY = "dashboard:sidebar-collapsed";
const COLLAPSE_EVENT = "dashboard:sidebar-collapsed-change";

// Used only if localStorage is unavailable (private mode, blocked storage).
let collapsedFallback = false;

export function subscribeCollapsed(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(COLLAPSE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COLLAPSE_EVENT, onChange);
  };
}

export function readCollapsed(): boolean {
  try {
    const stored = localStorage.getItem(COLLAPSE_KEY);
    if (stored !== null) return stored === "1";
  } catch {
    // fall through to the in-memory value
  }
  return collapsedFallback;
}

export function writeCollapsed(value: boolean) {
  collapsedFallback = value;
  try {
    localStorage.setItem(COLLAPSE_KEY, value ? "1" : "0");
  } catch {
    // ignore: the in-memory fallback still works for this session
  }
  window.dispatchEvent(new Event(COLLAPSE_EVENT));
}
