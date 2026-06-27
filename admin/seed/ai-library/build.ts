import { ASSESSMENT } from "../aiConfig";
import { GeneratedCourse, GenLesson, GenQuiz, GenQuestion, GenStage, GenerateOptions } from "../types";
import { RealChapter, RealCourse, RealQ } from "./types";

const bullets = (a: string[]) => a.map((x) => `- ${x}`).join("\n");

function toQuestion(r: RealQ): GenQuestion {
  let type = r.type;
  let options = r.options ?? [];
  if (!type) {
    const lc = options.map((o) => o.toLowerCase()).sort().join(",");
    if (options.length === 2 && lc === "false,true") type = "true_false";
    else if (options.length === 0) type = "fill_blank";
    else type = "multiple_choice";
  }
  if (type === "true_false") options = ["True", "False"];
  return { type, prompt: r.q, options: type === "fill_blank" ? [] : options, answer: r.answer, explanation: r.explanation ?? "" };
}

function lessonsFor(ch: RealChapter): GenLesson[] {
  const steps = ch.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  return [
    {
      title: `Key concepts: ${ch.title}`,
      body: `## Overview\n${ch.summary}\n\n## Key concepts\n${bullets(ch.concepts)}${ch.example ? `\n\n## Example\n${ch.example}` : ""}`,
      content: { summary: ch.summary, concepts: ch.concepts, example: ch.example ?? null },
      duration_minutes: 7,
      xp_reward: 15,
    },
    {
      title: `Step by step: ${ch.title}`,
      body: `## How to do it\n${steps}`,
      content: { steps: ch.steps },
      duration_minutes: 8,
      xp_reward: 15,
    },
    {
      title: `Tips & pitfalls: ${ch.title}`,
      body: `## Pro tips\n${bullets(ch.tips)}\n\n## Common mistakes to avoid\n${bullets(ch.mistakes)}\n\n## Practice\nApply "${ch.title}" to a real task, then check your work against the tips above.${ch.resources?.length ? `\n\n## Resources\n${bullets(ch.resources)}` : ""}`,
      content: { tips: ch.tips, mistakes: ch.mistakes, resources: ch.resources ?? [] },
      duration_minutes: 6,
      xp_reward: 15,
    },
  ];
}

function mkQuiz(title: string, kind: GenQuiz["kind"], qs: RealQ[], cfg: { passing: number; xp: number; cooldown: number }): GenQuiz {
  return { title, kind, passing_score: cfg.passing, xp_reward: cfg.xp, cooldown_minutes: cfg.cooldown, questions: qs.map(toQuestion) };
}

/** Evenly-spaced deterministic sample of up to n items. */
function sample<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr;
  const step = arr.length / n;
  return Array.from({ length: n }, (_, i) => arr[Math.floor(i * step)]);
}

export function buildCourseFromLibrary(rc: RealCourse, opts: GenerateOptions): GeneratedCourse {
  const allQ: RealQ[] = [];
  const stages: GenStage[] = rc.stages.map((st) => {
    const stageQ: RealQ[] = [];
    const chapters = st.chapters.map((ch) => {
      ch.quiz.forEach((q) => {
        stageQ.push(q);
        allQ.push(q);
      });
      return {
        title: ch.title,
        description: ch.summary,
        lessons: lessonsFor(ch),
        miniChallenge: mkQuiz(`Mini Challenge: ${ch.title}`, "mini_challenge", ch.quiz.slice(0, Math.min(3, ch.quiz.length)), ASSESSMENT.miniChallenge),
        quiz: mkQuiz(`Quiz: ${ch.title}`, "chapter", ch.quiz, ASSESSMENT.chapterQuiz),
      };
    });
    return { title: st.title, description: st.description ?? "", chapters, milestone: mkQuiz(`Milestone Test: ${st.title}`, "milestone", stageQ, ASSESSMENT.milestone) };
  });

  return {
    title: opts.topic,
    description: rc.description ?? `A practical, job-focused ${opts.topic} course for remote workers.`,
    difficulty: rc.difficulty ?? opts.difficulty,
    category: rc.category ?? opts.category ?? "general",
    stages,
    finalAssessment: mkQuiz(`Final Assessment: ${opts.topic}`, "final", sample(allQ, ASSESSMENT.final.questions), ASSESSMENT.final),
  };
}
