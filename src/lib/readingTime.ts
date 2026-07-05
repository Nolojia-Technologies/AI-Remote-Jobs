// Reading-time + engagement helpers for the smart lesson completion system.
//
// Reading speed: ~200 words/min ≈ 1000 characters/min, so a lesson's minimum
// reading time is max(1, ceil(chars / 1000)) minutes.

export const MIN_SCROLL_PERCENT = 90; // must scroll this far to complete
export const IDLE_LIMIT_MS = 120_000; // pause the timer after 2 min of no interaction
export const CHARS_PER_MINUTE = 1000;

// Minimum STUDY duration by lesson length (anti-skim, per the certification spec).
// A lesson can never be completed faster than its tier floor, even if the raw
// reading-time estimate is lower.
export const READING_TIER_CHARS = { long: 5000, veryLong: 12000 } as const;
export const READING_TIER_FLOOR_MIN = { short: 3, long: 8, veryLong: 15 } as const;

/** The minimum-minutes floor for a lesson of `characterCount` length. */
export function readingTierFloorMinutes(characterCount: number): number {
  if (characterCount >= READING_TIER_CHARS.veryLong) return READING_TIER_FLOOR_MIN.veryLong;
  if (characterCount >= READING_TIER_CHARS.long) return READING_TIER_FLOOR_MIN.long;
  return READING_TIER_FLOOR_MIN.short;
}

export interface ReadingEstimate {
  characterCount: number;
  minutes: number;
  requiredSeconds: number;
}

/** Strip HTML tags to plain text (for character-count fallback on rich lessons). */
export function stripHtml(html: string | null | undefined): string {
  return (html ?? "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Minimum study time from content length (uses the stored count when present).
 * Takes the greater of the natural reading estimate and the length-tier floor
 * (short 3m / long 8m / very long 15m) so learners can't skim to completion.
 */
export function computeReadingTime(text: string | null | undefined, storedChars?: number | null): ReadingEstimate {
  const characterCount = storedChars && storedChars > 0 ? storedChars : (text ?? "").length;
  const natural = Math.ceil(characterCount / CHARS_PER_MINUTE);
  const minutes = Math.max(readingTierFloorMinutes(characterCount), natural, 1);
  return { characterCount, minutes, requiredSeconds: minutes * 60 };
}

/** "5m 23s" — for the "Available in …" countdown. */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

/** Whole minutes, rounded up, for "6 / 8 min" style readouts. */
export function secondsToMinutes(seconds: number): number {
  return Math.max(0, Math.floor(seconds / 60));
}

export interface LessonSection {
  title: string;
  /** Where this section begins, as a % of the whole lesson (for scroll mapping). */
  startPct: number;
}

/**
 * Derive sections from the lesson's markdown headings (#, ##, ###) and the
 * character offset where each begins. Used to show ✓ / current / locked
 * section indicators based on how far the learner has scrolled.
 */
export function splitSections(body: string | null | undefined): LessonSection[] {
  const text = body ?? "";
  const total = Math.max(1, text.length);
  const out: LessonSection[] = [];
  let offset = 0;
  for (const line of text.split("\n")) {
    const m = line.match(/^\s{0,3}(#{1,3})\s+(.+?)\s*#*\s*$/);
    if (m) out.push({ title: m[2].trim(), startPct: Math.round((offset / total) * 100) });
    offset += line.length + 1; // + newline
  }
  return out;
}

export type SectionState = "completed" | "current" | "locked";

/** Classify each section against the current scroll %. */
export function sectionStates(sections: LessonSection[], scrollPct: number): SectionState[] {
  // The "current" section is the last one whose start is at/above scroll position.
  let currentIdx = 0;
  for (let i = 0; i < sections.length; i++) {
    if (scrollPct >= sections[i].startPct) currentIdx = i;
  }
  return sections.map((_, i) => {
    if (i < currentIdx) return "completed";
    if (i === currentIdx) return scrollPct >= MIN_SCROLL_PERCENT ? "completed" : "current";
    return "locked";
  });
}
