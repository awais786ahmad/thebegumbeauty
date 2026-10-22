// Meta Pixel helpers for the browser. The pixel ID is public, so it can live in client code.
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '1819011455882416';

type FbqParams = Record<string, unknown>;
declare global {
  interface Window { fbq?: (cmd: string, event: string, params?: FbqParams, opts?: { eventID?: string }) => void }
}

// Safe to call anywhere: does nothing on the server or when an ad blocker stops the pixel loading.
export const track = (event: string, params?: FbqParams, eventId?: string) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', event, params, eventId ? { eventID: eventId } : undefined);
};
