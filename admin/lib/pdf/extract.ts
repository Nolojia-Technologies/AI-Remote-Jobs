import "server-only";

export type SplitMode = "single" | "headings";
export interface ImportedLesson {
  title: string;
  html: string;
}

type Block =
  | { type: "h1" | "h2" | "h3" | "p"; text: string }
  | { type: "ul" | "ol"; items: string[] };

interface Line {
  text: string;
  size: number;
  y: number;
  page: number;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Extract lines (text + font size + y) from every page. */
async function readLines(bytes: Uint8Array): Promise<Line[]> {
  // Legacy build is the Node-safe entry; text extraction needs no canvas/worker.
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: bytes, useSystemFonts: true, isEvalSupported: false }).promise;
  const lines: Line[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    let cur: { parts: string[]; size: number; y: number } | null = null;

    const flush = () => {
      if (cur && cur.parts.join("").trim()) lines.push({ text: cur.parts.join("").replace(/\s+/g, " ").trim(), size: cur.size, y: cur.y, page: p });
      cur = null;
    };

    for (const item of tc.items as any[]) {
      if (typeof item.str !== "string") continue;
      const size = Math.abs(item.transform?.[3] ?? item.height ?? 12);
      const y = Math.round(item.transform?.[5] ?? 0);
      if (!cur) cur = { parts: [item.str], size, y };
      else if (Math.abs(y - cur.y) > Math.max(2, cur.size * 0.5)) {
        flush();
        cur = { parts: [item.str], size, y };
      } else {
        cur.parts.push(item.str);
        cur.size = Math.max(cur.size, size);
      }
      if (item.hasEOL) flush();
    }
    flush();
  }
  await doc.destroy?.();
  return lines;
}

/** Page count for a PDF (used by native PDF lessons). */
export async function countPdfPages(bytes: Uint8Array): Promise<number> {
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: bytes, isEvalSupported: false }).promise;
  const n = doc.numPages as number;
  await doc.destroy?.();
  return n;
}

/** Most common rounded line size = body text size. */
function bodySize(lines: Line[]): number {
  const counts = new Map<number, number>();
  for (const l of lines) {
    const k = Math.round(l.size);
    counts.set(k, (counts.get(k) ?? 0) + l.text.length);
  }
  let best = 12, max = 0;
  for (const [k, v] of counts) if (v > max) { max = v; best = k; }
  return best || 12;
}

/** Group lines into semantic blocks (headings / paragraphs / lists). */
function toBlocks(lines: Line[], body: number): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;
  let prev: Line | null = null;

  const flushPara = () => { if (para.length) { blocks.push({ type: "p", text: para.join(" ") }); para = []; } };
  const flushList = () => { if (list) { blocks.push(list); list = null; } };

  for (const line of lines) {
    const t = line.text;
    const ratio = line.size / body;
    const bullet = /^\s*[•▪●‣⁃∙*]\s+/.test(t) || /^\s*[-–]\s+/.test(t);
    const numbered = /^\s*\d+[.)]\s+/.test(t);
    const isHeading = ratio >= 1.15 && !bullet && !numbered && t.length < 120;

    if (isHeading) {
      flushPara(); flushList();
      const lvl = ratio >= 1.6 ? "h1" : ratio >= 1.35 ? "h2" : "h3";
      blocks.push({ type: lvl, text: t });
    } else if (bullet) {
      flushPara();
      if (!list || list.type !== "ul") { flushList(); list = { type: "ul", items: [] }; }
      list.items.push(t.replace(/^\s*[•▪●‣⁃∙*\-–]\s+/, ""));
    } else if (numbered) {
      flushPara();
      if (!list || list.type !== "ol") { flushList(); list = { type: "ol", items: [] }; }
      list.items.push(t.replace(/^\s*\d+[.)]\s+/, ""));
    } else {
      flushList();
      // New paragraph on a large vertical gap or a page change.
      if (prev && (prev.page !== line.page || prev.y - line.y > body * 1.8)) flushPara();
      para.push(t);
    }
    prev = line;
  }
  flushPara(); flushList();
  return blocks;
}

function renderBlocks(blocks: Block[]): string {
  return blocks
    .map((b) => {
      if (b.type === "ul") return `<ul>${b.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
      if (b.type === "ol") return `<ol>${b.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ol>`;
      const tb = b as { type: string; text: string }; // h1–h4 / p
      return `<${tb.type}>${escapeHtml(tb.text)}</${tb.type}>`;
    })
    .join("\n");
}

/** Render semantic blocks as Markdown (the faithful source for AI restructuring). */
function blocksToMarkdown(blocks: Block[]): string {
  return blocks
    .map((b) => {
      if (b.type === "ul") return b.items.map((i) => `- ${i}`).join("\n");
      if (b.type === "ol") return b.items.map((i, n) => `${n + 1}. ${i}`).join("\n");
      const tb = b as { type: string; text: string }; // h1–h3 / p
      if (tb.type === "h1") return `# ${tb.text}`;
      if (tb.type === "h2") return `## ${tb.text}`;
      if (tb.type === "h3") return `### ${tb.text}`;
      return tb.text; // paragraph
    })
    .join("\n\n");
}

export interface SourceSegment {
  title: string;
  markdown: string;
}

/**
 * Extract a PDF into faithful Markdown SEGMENTS (one per intended lesson).
 * Unlike extractLessonsFromPdf (which renders final HTML), this is the raw,
 * structure-preserving source material fed to the AI restructuring step.
 */
export async function extractSourceSegments(
  bytes: Uint8Array,
  opts: { splitMode: SplitMode; fallbackTitle: string }
): Promise<SourceSegment[]> {
  const lines = await readLines(bytes);
  if (lines.length === 0) return [];
  const body = bodySize(lines);
  const blocks = toBlocks(lines, body);

  if (opts.splitMode === "single") {
    const heading = blocks.find((b) => b.type === "h1" || b.type === "h2") as { text: string } | undefined;
    return [{ title: heading?.text || opts.fallbackTitle, markdown: blocksToMarkdown(blocks) }];
  }

  const splitType = blocks.some((b) => b.type === "h1") ? "h1" : "h2";
  const segs: { title: string; blocks: Block[] }[] = [];
  let cur: { title: string; blocks: Block[] } | null = null;
  for (const b of blocks) {
    if (b.type === splitType) {
      if (cur) segs.push(cur);
      cur = { title: (b as { text: string }).text || opts.fallbackTitle, blocks: [] };
    } else {
      if (!cur) cur = { title: opts.fallbackTitle, blocks: [] };
      cur.blocks.push(b);
    }
  }
  if (cur) segs.push(cur);
  if (segs.length === 0) segs.push({ title: opts.fallbackTitle, blocks });

  return segs.map((s) => ({ title: s.title, markdown: blocksToMarkdown(s.blocks) }));
}

/** Extract a PDF into one or more lessons. */
export async function extractLessonsFromPdf(
  bytes: Uint8Array,
  opts: { splitMode: SplitMode; fallbackTitle: string }
): Promise<ImportedLesson[]> {
  const lines = await readLines(bytes);
  if (lines.length === 0) return [{ title: opts.fallbackTitle, html: "<p></p>" }];

  const body = bodySize(lines);
  const blocks = toBlocks(lines, body);

  if (opts.splitMode === "single") {
    const heading = blocks.find((b) => b.type === "h1" || b.type === "h2") as { text: string } | undefined;
    return [{ title: heading?.text || opts.fallbackTitle, html: renderBlocks(blocks) || "<p></p>" }];
  }

  // Split on H1 (fall back to H2 if the doc has no H1).
  const splitType = blocks.some((b) => b.type === "h1") ? "h1" : "h2";
  const lessons: { title: string; blocks: Block[] }[] = [];
  let cur: { title: string; blocks: Block[] } | null = null;
  for (const b of blocks) {
    if (b.type === splitType) {
      if (cur) lessons.push(cur);
      cur = { title: (b as { text: string }).text || opts.fallbackTitle, blocks: [] };
    } else {
      if (!cur) cur = { title: opts.fallbackTitle, blocks: [] };
      cur.blocks.push(b);
    }
  }
  if (cur) lessons.push(cur);
  if (lessons.length === 0) lessons.push({ title: opts.fallbackTitle, blocks });

  return lessons.map((l) => ({ title: l.title, html: renderBlocks(l.blocks) || "<p></p>" }));
}
