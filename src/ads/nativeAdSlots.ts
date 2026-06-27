import { NATIVE_ADS_ENABLED } from "./adConfig";

/** Marker inserted into a list to indicate "render a native ad card here". */
export interface NativeAdSlot {
  __nativeAd: true;
  key: string;
}

export function isNativeAdSlot(x: unknown): x is NativeAdSlot {
  return typeof x === "object" && x !== null && (x as NativeAdSlot).__nativeAd === true;
}

/**
 * Insert a native-ad slot after every `interval` items. Returns the list
 * unchanged when native ads aren't enabled (e.g. production without a native
 * unit id), so screens can call it unconditionally.
 *
 *   withNativeAds(jobs, 5) → [job, job, job, job, job, AD, job, …]
 */
export function withNativeAds<T>(items: T[], interval: number): (T | NativeAdSlot)[] {
  if (!NATIVE_ADS_ENABLED || interval <= 0 || items.length < interval) return items;
  const out: (T | NativeAdSlot)[] = [];
  items.forEach((item, i) => {
    out.push(item);
    if ((i + 1) % interval === 0) out.push({ __nativeAd: true, key: `native-ad-${i}` });
  });
  return out;
}

/** Insert a single native-ad slot after the first `afterCount` items. */
export function withNativeAdAfter<T>(items: T[], afterCount: number): (T | NativeAdSlot)[] {
  if (!NATIVE_ADS_ENABLED || items.length < afterCount) return items;
  const out: (T | NativeAdSlot)[] = [...items];
  out.splice(afterCount, 0, { __nativeAd: true, key: `native-ad-after-${afterCount}` });
  return out;
}
