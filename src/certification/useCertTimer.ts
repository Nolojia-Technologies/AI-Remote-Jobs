import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

/**
 * Countdown derived from an absolute server `expires_at`. The server owns the
 * deadline, so the timer can't be extended by backgrounding or clock changes —
 * we recompute remaining time from wall-clock on every tick AND on app resume,
 * and fire `onExpire` exactly once when it hits zero.
 */
export function useCertTimer(expiresAt: string | null | undefined, onExpire: () => void): number {
  const [remaining, setRemaining] = useState(0);
  const firedRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!expiresAt) return;
    firedRef.current = false;
    const end = new Date(expiresAt).getTime();

    const tick = () => {
      const secs = Math.max(0, Math.round((end - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpireRef.current();
      }
    };

    tick();
    const iv = setInterval(tick, 1000);
    const sub = AppState.addEventListener("change", (s: AppStateStatus) => {
      if (s === "active") tick(); // re-sync immediately on resume
    });
    return () => {
      clearInterval(iv);
      sub.remove();
    };
  }, [expiresAt]);

  return remaining;
}

/** "44:07" mm:ss for the countdown header. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
