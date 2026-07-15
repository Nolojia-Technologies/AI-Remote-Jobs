// Local fallback catalog + captcha generators for the AI Tasks hub.
//
// Two jobs:
//  1. Captcha puzzles are ALWAYS generated on-device (the DB captcha rows
//     just say which generator to use). Validation happens locally; the
//     server RPC then enforces rate limits and daily caps when crediting.
//  2. When the DB catalog is unreachable / migration 022 hasn't run yet,
//     these sample tasks keep the hub fully usable (earnings tracked
//     locally until the backend is live).

import { AiTask, CaptchaGenerator } from "../types/tasks.types";

export interface CaptchaPuzzle {
  /** Big text rendered as the puzzle (characters / equation / emoji row). */
  display: string;
  prompt: string;
  /** Multiple-choice options; absent → free-text input. */
  options?: string[];
  /** Image-grid captchas: photo URLs laid out as a tappable grid. */
  images?: string[];
  /** Index into options/images, or the exact expected text. */
  answer: number | string;
  /** Slider captchas: target 0–100 (±8 tolerance). */
  sliderTarget?: number;
}

const rand = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(arr: readonly T[]) => arr[rand(arr.length)];

const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const IMAGE_CAPTCHA_GRID = 6;

export function generateCaptcha(
  kind: CaptchaGenerator,
  imagePool?: { label: string; url: string }[]
): CaptchaPuzzle {
  switch (kind) {
    case "image": {
      // reCAPTCHA-style grid: real photos, tap the one matching the prompt.
      // Falls back to the emoji selection captcha if the pool is too small.
      const pool = imagePool ?? [];
      if (pool.length < IMAGE_CAPTCHA_GRID) return generateCaptcha("selection");
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const grid = shuffled.slice(0, IMAGE_CAPTCHA_GRID);
      const answer = rand(IMAGE_CAPTCHA_GRID);
      return {
        display: "",
        prompt: `Tap the ${grid[answer].label}`,
        images: grid.map((g) => g.url),
        answer,
      };
    }
    case "text": {
      let s = "";
      for (let i = 0; i < 5; i++) s += CAPTCHA_CHARS[rand(CAPTCHA_CHARS.length)];
      return {
        display: s.split("").join(" "),
        prompt: "Type the characters you see (no spaces)",
        answer: s,
      };
    }
    case "math": {
      const a = 2 + rand(18);
      const b = 2 + rand(18);
      const add = Math.random() > 0.4;
      const result = add ? a + b : Math.max(a, b) - Math.min(a, b);
      return {
        display: add ? `${a} + ${b} = ?` : `${Math.max(a, b)} − ${Math.min(a, b)} = ?`,
        prompt: "Solve the math puzzle",
        answer: String(result),
      };
    }
    case "selection": {
      const sets = [
        { label: "car", match: "🚗", decoys: ["🚲", "✈️", "🚤"] },
        { label: "cat", match: "🐱", decoys: ["🐶", "🐭", "🦊"] },
        { label: "apple", match: "🍎", decoys: ["🍌", "🍇", "🍊"] },
        { label: "house", match: "🏠", decoys: ["🏢", "⛺", "🏰"] },
        { label: "tree", match: "🌳", decoys: ["🌵", "🌻", "🍄"] },
        { label: "fish", match: "🐟", decoys: ["🐙", "🦀", "🐢"] },
      ] as const;
      const set = pick(sets);
      const options: string[] = [...set.decoys];
      const idx = rand(options.length + 1);
      options.splice(idx, 0, set.match);
      return {
        display: "🔍",
        prompt: `Select the ${set.label}`,
        options,
        answer: idx,
      };
    }
    case "slider": {
      const target = 15 + rand(71); // 15–85 so it's never trivially at an edge
      return {
        display: "🎯",
        prompt: "Slide the handle to match the target position",
        answer: target,
        sliderTarget: target,
      };
    }
  }
}

/** Slider captchas accept ±8 of the target. */
export function sliderMatches(value: number, target: number): boolean {
  return Math.abs(value - target) <= 8;
}

// ─── Fallback catalog (used when the DB catalog is unavailable) ─────

export type LocalTask = AiTask & { localAnswer: number | number[] | null };

let seq = 0;
function task(
  kind: AiTask["kind"],
  category: string,
  title: string,
  question: string,
  options: string[],
  answer: number | number[] | null,
  opts: {
    difficulty?: AiTask["difficulty"];
    rewardCents?: number;
    xp?: number;
    estSeconds?: number;
  } = {}
): LocalTask {
  seq += 1;
  return {
    id: `local-${kind}-${seq}`,
    kind,
    category,
    title,
    description: "",
    difficulty: opts.difficulty ?? "easy",
    rewardCents: opts.rewardCents ?? (kind === "annotation" ? 8 : 5),
    xp: opts.xp ?? 3,
    estSeconds: opts.estSeconds ?? 20,
    content: { question, options },
    repeatable: false,
    minTaskLevel: 1,
    requiredCourseId: null,
    isLocal: true,
    localAnswer: answer,
  };
}

export const LOCAL_MICROTASKS: LocalTask[] = [
  task("microtask", "sentiment_analysis", "Rate this review's sentiment",
    '"Amazing app, earned my first dollar in a day!" — Sentiment?',
    ["Positive", "Negative", "Mixed", "Neutral"], 0),
  task("microtask", "sentiment_analysis", "Rate this review's sentiment",
    '"The app is fine but ads are too frequent." — Sentiment?',
    ["Positive", "Negative", "Mixed", "Neutral"], 2),
  task("microtask", "text_classification", "Classify this message",
    '"URGENT: your account will be suspended, click here now!" — Category?',
    ["Phishing / scam", "Delivery update", "Newsletter", "Personal"], 0),
  task("microtask", "text_classification", "Classify this message",
    '"Team standup moved to 10:30 tomorrow." — Category?',
    ["Work", "Marketing", "Fraud alert", "Delivery"], 0),
  task("microtask", "prompt_evaluation", "Pick the better AI answer",
    'User: "Give me a healthy breakfast idea." Which reply is more helpful?',
    ["A: Oatmeal with banana and peanut butter — ready in 5 minutes.", "B: Food is any substance consumed for nutritional support."], 0,
    { difficulty: "medium", rewardCents: 8, xp: 5, estSeconds: 30 }),
  task("microtask", "chatbot_evaluation", "Rate the chatbot reply",
    'User: "I lost my password." Bot: "Have you tried being smarter?" — Is this reply acceptable?',
    ["No — rude and unhelpful", "Yes — it answers the question"], 0,
    { difficulty: "medium", rewardCents: 8, xp: 5 }),
  task("microtask", "translation_validation", "Validate this translation",
    '"Habari yako?" → "How are you?" — Is the Swahili→English translation correct?',
    ["Correct", "Incorrect"], 0),
  task("microtask", "ocr_correction", "Fix the OCR error",
    'Scanned text reads: "The qu1ck brown f0x". What is the correct text?',
    ["The quick brown fox", "The quack brown fix", "The quick brawn fax"], 0),
  task("microtask", "response_rating", "Rate the AI response",
    'User: "Summarize: The meeting is at 3pm in Room B." AI: "Meeting — 3pm, Room B." — Rating?',
    ["Excellent — accurate and concise", "Poor — missing information"], 0),
  task("microtask", "intent_classification", "Classify the intent",
    '"Can you cancel my order from yesterday?" — What does the user want?',
    ["Cancel an order", "Track an order", "Place an order", "Complain"], 0),
];

export const LOCAL_ANNOTATION: LocalTask[] = [
  task("annotation", "image_labeling", "Identify the animal", "Which animal is shown? 🦒",
    ["Giraffe", "Zebra", "Antelope", "Camel"], 0),
  task("annotation", "image_labeling", "Identify the product", "Which product is shown? 👟",
    ["Sneaker", "Sandal", "Boot", "Sock"], 0),
  task("annotation", "object_detection", "Count the objects", "How many vehicles? 🚗🚙🚕🚲",
    ["3 vehicles + 1 bicycle", "4 vehicles", "2 vehicles", "5 vehicles"], 0,
    { difficulty: "medium", rewardCents: 8, xp: 5 }),
  task("annotation", "emotion_labeling", "Label the emotion",
    '"I studied so hard and still failed the exam…" — Emotion?',
    ["Sadness", "Disappointment", "Anger", "Fear"], [0, 1],
    { difficulty: "medium", rewardCents: 8, xp: 5 }),
  task("annotation", "entity_recognition", "Find the entity",
    '"Amina flew from Nairobi to Doha on Tuesday." — Which word is a PERSON?',
    ["Amina", "Nairobi", "Doha", "Tuesday"], 0),
  task("annotation", "document_classification", "Categorize the document",
    '"INVOICE #2231 — Total due: $450, payment within 30 days." — Document type?',
    ["Invoice", "Receipt", "Contract", "Resume"], 0),
];

export const LOCAL_SURVEYS: LocalTask[] = [
  {
    id: "local-survey-1",
    kind: "survey",
    category: "survey",
    title: "Your earning goals",
    description: "4 quick questions — help us build better tasks for you.",
    difficulty: "easy",
    rewardCents: 40,
    xp: 8,
    estSeconds: 90,
    content: {
      questions: [
        { q: "What's your monthly earning goal from AI tasks?", options: ["Under $10", "$10–$50", "$50–$200", "$200+"] },
        { q: "How much time can you spend daily?", options: ["10 min", "30 min", "1 hour", "2+ hours"] },
        { q: "Which tasks do you enjoy most?", options: ["Captchas", "Image labeling", "Surveys", "AI rating"] },
        { q: "Preferred payout method?", options: ["M-Pesa", "PayPal", "Bank", "Crypto"] },
      ],
    },
    repeatable: false,
    minTaskLevel: 1,
    requiredCourseId: null,
    isLocal: true,
    localAnswer: null,
  },
];

export function localTasksByKind(kind: AiTask["kind"]): LocalTask[] {
  if (kind === "microtask") return LOCAL_MICROTASKS;
  if (kind === "annotation") return LOCAL_ANNOTATION;
  if (kind === "survey") return LOCAL_SURVEYS;
  return [];
}
