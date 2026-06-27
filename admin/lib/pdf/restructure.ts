import "server-only";
import { marked } from "marked";
import { extractSourceSegments, type SplitMode } from "./extract";
import { restructureLessonPrompt } from "../ai/prompts";
import { lessonSchema } from "../ai/schema";
import { generateJSON } from "../ai/provider";

/**
 * Turns an uploaded PDF into native, premium-structured lessons.
 *
 * Pipeline: extract faithful Markdown segments → for each, ask the AI to
 * RESTRUCTURE (not rewrite) the source into our 7-section lesson format →
 * emit `body` Markdown identical in shape to hand/AI-authored lessons. The
 * mobile reader renders these with the full reading experience + cooldown/quiz
 * gates, so PDF lessons become indistinguishable from authored ones.
 *
 * Fidelity: the AI is instructed to preserve the source's facts and omit
 * unsupported sections. If a model call fails (or no API key is configured),
 * that segment falls back to its faithful raw Markdown — never a hard failure.
 */
export interface StructuredLesson {
  title: string;
  body: string; // restructured Markdown (stored as cms_lessons.body)
  html: string; // marked(body) — for the admin preview only
}

const MIN_SOURCE_CHARS = 40; // skip empty / near-empty segments

export async function aiStructureLessonsFromPdf(
  bytes: Uint8Array,
  opts: { splitMode: SplitMode; fallbackTitle: string; market: string }
): Promise<StructuredLesson[]> {
  const segments = (
    await extractSourceSegments(bytes, { splitMode: opts.splitMode, fallbackTitle: opts.fallbackTitle })
  ).filter((s) => s.markdown.replace(/\s+/g, "").length >= MIN_SOURCE_CHARS);

  if (segments.length === 0) return [];

  const out: StructuredLesson[] = [];
  // Sequential: respects model rate limits and keeps lesson order deterministic.
  for (const seg of segments) {
    try {
      const lesson = await generateJSON({
        ...restructureLessonPrompt({ sourceTitle: seg.title, sourceMarkdown: seg.markdown, market: opts.market }),
        schema: lessonSchema,
      });
      const body = lesson.body?.trim() || seg.markdown;
      out.push({ title: (lesson.title || seg.title).trim(), body, html: marked.parse(body) as string });
    } catch {
      // Faithful fallback: keep the raw extracted Markdown rather than failing.
      out.push({ title: seg.title, body: seg.markdown, html: marked.parse(seg.markdown) as string });
    }
  }
  return out;
}
