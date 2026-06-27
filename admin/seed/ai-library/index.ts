import { RealCourse } from "./types";
import { virtualAssistant } from "./courses/virtualAssistant";
import { chatgptForWork } from "./courses/chatgptForWork";
import { customerSupport } from "./courses/customerSupport";

/**
 * Hand-authored, real curricula. Each entry expands (via library/build.ts) into
 * a full course with genuine, distinct lessons + quizzes — not generic
 * templates. Add a new course by authoring a RealCourse and registering it here.
 */
export const COURSE_LIBRARY: Record<string, RealCourse> = {
  [virtualAssistant.slug]: virtualAssistant,
  [chatgptForWork.slug]: chatgptForWork,
  [customerSupport.slug]: customerSupport,
};

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function findLibraryCourse(topic: string): RealCourse | null {
  return COURSE_LIBRARY[slugify(topic)] ?? null;
}

export function hasRealContent(topic: string): boolean {
  return !!findLibraryCourse(topic);
}

export const LIBRARY_SLUGS = Object.keys(COURSE_LIBRARY);
