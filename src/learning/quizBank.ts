import { PROGRESSION } from "./config";
import { QuizGateQuestion } from "./types";

// Generic professional / AI-skills question bank used for chapter gate quizzes.
// Deterministically sampled per chapter so a chapter always shows the same set.
const BANK: QuizGateQuestion[] = [
  {
    question: "What is the golden rule when using AI tools professionally?",
    options: ["Publish raw output", "AI generates, YOU refine & verify", "Never edit", "Use the longest answer"],
    answer: "AI generates, YOU refine & verify",
  },
  {
    question: "Which framework helps you write effective prompts?",
    options: ["RCTF (Role, Context, Task, Format)", "HTML", "FIFO", "ASAP"],
    answer: "RCTF (Role, Context, Task, Format)",
  },
  {
    question: "A client messages outside your hours with an urgent task. Best move?",
    options: ["Ignore it", "Acknowledge and give a clear timeline", "Reply rudely", "Cancel the contract"],
    answer: "Acknowledge and give a clear timeline",
  },
  {
    question: "What does a low 'temperature' setting produce in an LLM?",
    options: ["Random output", "Focused, deterministic output", "Errors", "Longer output"],
    answer: "Focused, deterministic output",
  },
  {
    question: "Roughly how much of a word is one LLM 'token'?",
    options: ["A whole sentence", "About 3/4 of a word", "Ten words", "A password"],
    answer: "About 3/4 of a word",
  },
  {
    question: "Before delivering AI-written content to a client, you should always:",
    options: ["Send it instantly", "Edit, fact-check, and match their voice", "Add more emojis", "Double the length"],
    answer: "Edit, fact-check, and match their voice",
  },
  {
    question: "What is the most reliable way to keep remote clients happy?",
    options: ["Disappear for days", "Clear, proactive communication", "Over-promise", "Avoid updates"],
    answer: "Clear, proactive communication",
  },
  {
    question: "Which is a strong professional habit for remote AI work?",
    options: ["Missing deadlines", "Tracking tasks and meeting deadlines", "Ignoring feedback", "Working without tools"],
    answer: "Tracking tasks and meeting deadlines",
  },
  {
    question: "What makes a great product description?",
    options: ["Feature dump", "Benefit-focused with a clear call-to-action", "No structure", "All caps"],
    answer: "Benefit-focused with a clear call-to-action",
  },
  {
    question: "How should you handle an unhappy customer?",
    options: ["Argue back", "Acknowledge, apologise, offer a solution", "Ignore them", "Blame the customer"],
    answer: "Acknowledge, apologise, offer a solution",
  },
];

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** One deterministic question for a given seed (used by the revision system). */
export function getRevisionQuestion(seed: string): QuizGateQuestion {
  return BANK[hash(seed) % BANK.length];
}

/** Deterministic per-chapter sample of N questions. */
export function getChapterQuiz(chapterId: string): QuizGateQuestion[] {
  const n = PROGRESSION.quiz.questionsPerQuiz;
  const seed = hash(chapterId);
  const idxs: number[] = [];
  let cursor = seed % BANK.length;
  while (idxs.length < Math.min(n, BANK.length)) {
    if (!idxs.includes(cursor)) idxs.push(cursor);
    cursor = (cursor + 1 + (seed % 3)) % BANK.length;
  }
  return idxs.map((i) => BANK[i]);
}
