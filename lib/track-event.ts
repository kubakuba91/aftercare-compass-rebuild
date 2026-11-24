// Minimal, gtag-compatible event push. No analytics vendor is wired in this codebase yet;
// events land on window.dataLayer so GTM/gtag can pick them up once installed.
type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] };

export function trackEvent(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...params });
}
