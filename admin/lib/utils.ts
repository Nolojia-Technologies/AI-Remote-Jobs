import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number with thousands separators; falls back to "0". */
export function formatNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "0";
  return n.toLocaleString();
}

/** Format a percentage (0–100) to one decimal place. */
export function formatPercent(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "0%";
  return `${Math.round(n * 10) / 10}%`;
}

/** Relative "time ago" for activity feeds. */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Compact human duration since `iso` — e.g. "3mo", "12d", "5h". For tenure. */
export function formatDuration(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return "—";
  const d = Math.floor(diff / 86400000);
  if (d >= 365) { const y = Math.floor(d / 365); const mo = Math.floor((d % 365) / 30); return mo ? `${y}y ${mo}mo` : `${y}y`; }
  if (d >= 30) return `${Math.floor(d / 30)}mo`;
  if (d >= 1) return `${d}d`;
  const h = Math.floor(diff / 3600000);
  if (h >= 1) return `${h}h`;
  return "today";
}

/** URL-safe slug from a title. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
