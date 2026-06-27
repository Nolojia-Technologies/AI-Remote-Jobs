export interface SeedQuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  question_type: "multiple_choice" | "true_false" | "scenario";
  options: string[];
  correct_answer: string;
  explanation: string;
  order_index: number;
}

export interface SeedQuiz {
  id: string;
  module_id: string;
  title: string;
  description: string;
  pass_score: number;
  xp_reward: number;
  time_limit_seconds: number | null;
  is_active: boolean;
}

export const SEED_QUIZZES: SeedQuiz[] = [
  {
    id: "e0000001-0000-0000-0000-000000000000",
    module_id: "a0000001-0000-0000-0000-000000000000",
    title: "AI Foundations Quiz",
    description: "Test your understanding of AI basics and remote work opportunities.",
    pass_score: 80,
    xp_reward: 50,
    time_limit_seconds: 300,
    is_active: true,
  },
  {
    id: "e0000002-0000-0000-0000-000000000000",
    module_id: "a0000002-0000-0000-0000-000000000000",
    title: "ChatGPT Mastery Quiz",
    description: "Prove your ChatGPT skills with practical scenarios.",
    pass_score: 80,
    xp_reward: 50,
    time_limit_seconds: 360,
    is_active: true,
  },
  {
    id: "e0000003-0000-0000-0000-000000000000",
    module_id: "b0000001-0000-0000-0000-000000000000",
    title: "LLM Fundamentals Quiz",
    description: "Test your knowledge of how large language models work.",
    pass_score: 80,
    xp_reward: 50,
    time_limit_seconds: 300,
    is_active: true,
  },
  {
    id: "e0000004-0000-0000-0000-000000000000",
    module_id: "c0000001-0000-0000-0000-000000000000",
    title: "Content Writing Basics Quiz",
    description: "Assess your understanding of content writing principles.",
    pass_score: 80,
    xp_reward: 50,
    time_limit_seconds: 300,
    is_active: true,
  },
];

export const SEED_QUIZ_QUESTIONS: SeedQuizQuestion[] = [
  // ─── quiz-ava-1 ──────────────────────────────────────────────────────────
  {
    id: "f0000001-0000-0000-0000-000000000000",
    quiz_id: "e0000001-0000-0000-0000-000000000000",
    question: "What does AI stand for?",
    question_type: "multiple_choice",
    options: [
      "Automated Intelligence",
      "Artificial Intelligence",
      "Advanced Interface",
      "Automated Internet",
    ],
    correct_answer: "Artificial Intelligence",
    explanation: "AI stands for Artificial Intelligence — the simulation of human intelligence in machines.",
    order_index: 1,
  },
  {
    id: "f0000002-0000-0000-0000-000000000000",
    quiz_id: "e0000001-0000-0000-0000-000000000000",
    question: "Which of the following is NOT an AI tool mentioned in the course?",
    question_type: "multiple_choice",
    options: ["ChatGPT", "Midjourney", "Photoshop", "Claude"],
    correct_answer: "Photoshop",
    explanation: "Photoshop is a traditional design tool by Adobe, not an AI tool (though it now has some AI features). ChatGPT, Midjourney, and Claude are all AI tools.",
    order_index: 2,
  },
  {
    id: "f0000003-0000-0000-0000-000000000000",
    quiz_id: "e0000001-0000-0000-0000-000000000000",
    question: "An AI virtual assistant can only work for clients in the same country.",
    question_type: "true_false",
    options: ["True", "False"],
    correct_answer: "False",
    explanation: "AI virtual assistants work remotely, meaning they can serve clients anywhere in the world — a huge advantage!",
    order_index: 3,
  },
  {
    id: "f0000004-0000-0000-0000-000000000000",
    quiz_id: "e0000001-0000-0000-0000-000000000000",
    question: "A client messages you asking for help with their schedule. Which tool would you use?",
    question_type: "scenario",
    options: [
      "Midjourney for creating schedule images",
      "ChatGPT to draft a schedule and Google Calendar to implement it",
      "Only Microsoft Word to write out the schedule",
      "Send it back saying it's too complex",
    ],
    correct_answer: "ChatGPT to draft a schedule and Google Calendar to implement it",
    explanation: "The best approach combines AI (ChatGPT for drafting/planning) with productivity tools (Google Calendar for implementation).",
    order_index: 4,
  },
  {
    id: "f0000005-0000-0000-0000-000000000000",
    quiz_id: "e0000001-0000-0000-0000-000000000000",
    question: "Entry-level AI virtual assistants can realistically earn how much per month?",
    question_type: "multiple_choice",
    options: [
      "$50–$100/month",
      "$400–$1,200/month",
      "$5,000–$10,000/month",
      "Nothing — it's all volunteer work",
    ],
    correct_answer: "$400–$1,200/month",
    explanation: "Entry-level AI virtual assistants typically earn $400–$1,200/month in ongoing contracts, with rates growing as you build experience.",
    order_index: 5,
  },
  // ─── quiz-ava-2 ──────────────────────────────────────────────────────────
  {
    id: "f0000006-0000-0000-0000-000000000000",
    quiz_id: "e0000002-0000-0000-0000-000000000000",
    question: "What does RCTF stand for in prompt writing?",
    question_type: "multiple_choice",
    options: [
      "Role, Context, Task, Format",
      "Research, Create, Test, Finalise",
      "Repeat, Check, Test, Fix",
      "Role, Content, Time, Feedback",
    ],
    correct_answer: "Role, Context, Task, Format",
    explanation: "RCTF is a framework for writing effective prompts: Role (who ChatGPT should be), Context (background info), Task (what you want), Format (how the output should look).",
    order_index: 1,
  },
  {
    id: "f0000007-0000-0000-0000-000000000000",
    quiz_id: "e0000002-0000-0000-0000-000000000000",
    question: "Which is the better prompt for writing a customer email?",
    question_type: "scenario",
    options: [
      `"Write an email"`,
      `"You are a professional assistant. Write a 150-word email to reschedule a meeting from Tuesday 3pm to Thursday 2pm with client John. Keep it professional but friendly."`,
      `"Email about meeting change"`,
      `"Fix my email please"`,
    ],
    correct_answer: `"You are a professional assistant. Write a 150-word email to reschedule a meeting from Tuesday 3pm to Thursday 2pm with client John. Keep it professional but friendly."`,
    explanation: "This prompt uses the RCTF method — it gives ChatGPT a role, context, specific task, and format requirements.",
    order_index: 2,
  },
  {
    id: "f0000008-0000-0000-0000-000000000000",
    quiz_id: "e0000002-0000-0000-0000-000000000000",
    question: "You should always publish AI-generated content without editing it.",
    question_type: "true_false",
    options: ["True", "False"],
    correct_answer: "False",
    explanation: "Never publish raw AI output. Always edit for tone, verify facts, add personal insight, and ensure it fits the brand voice.",
    order_index: 3,
  },
  // ─── quiz-pe-1 ──────────────────────────────────────────────────────────
  {
    id: "f0000009-0000-0000-0000-000000000000",
    quiz_id: "e0000003-0000-0000-0000-000000000000",
    question: "What is a 'token' in the context of large language models?",
    question_type: "multiple_choice",
    options: [
      "A cryptocurrency used to pay for AI services",
      "Roughly 3/4 of a word — the unit LLMs process text in",
      "A security password for API access",
      "A complete sentence processed by the AI",
    ],
    correct_answer: "Roughly 3/4 of a word — the unit LLMs process text in",
    explanation: "LLMs process text as tokens, where one token is approximately 3/4 of a word. Understanding this helps you work within context window limits.",
    order_index: 1,
  },
  {
    id: "f0000010-0000-0000-0000-000000000000",
    quiz_id: "e0000003-0000-0000-0000-000000000000",
    question: "Which temperature setting would you use for a factual report that must be accurate?",
    question_type: "multiple_choice",
    options: [
      "0.9 — high temperature for creativity",
      "0.1–0.3 — low temperature for focused output",
      "1.5 — maximum temperature",
      "Temperature doesn't affect accuracy",
    ],
    correct_answer: "0.1–0.3 — low temperature for focused output",
    explanation: "Low temperature (0.1–0.3) produces focused, deterministic output — ideal for factual content where accuracy matters.",
    order_index: 2,
  },
  {
    id: "f0000011-0000-0000-0000-000000000000",
    quiz_id: "e0000003-0000-0000-0000-000000000000",
    question: "An LLM is essentially a very sophisticated prediction machine for the next word.",
    question_type: "true_false",
    options: ["True", "False"],
    correct_answer: "True",
    explanation: "At its core, an LLM predicts the most likely next token given the context. Great prompts make the desired prediction obvious.",
    order_index: 3,
  },
  // ─── quiz-acw-1 ─────────────────────────────────────────────────────────
  {
    id: "f0000012-0000-0000-0000-000000000000",
    quiz_id: "e0000004-0000-0000-0000-000000000000",
    question: "What is the 'Golden Rule' of AI content writing?",
    question_type: "multiple_choice",
    options: [
      "AI writes everything automatically — no editing needed",
      "AI generates. YOU create. Always edit and verify AI output.",
      "Never use AI for professional content",
      "Always use the longest possible AI output",
    ],
    correct_answer: "AI generates. YOU create. Always edit and verify AI output.",
    explanation: "The golden rule is that AI is a tool to enhance your writing, not replace your judgment. Always edit for tone, verify facts, and add your insight.",
    order_index: 1,
  },
  {
    id: "f0000013-0000-0000-0000-000000000000",
    quiz_id: "e0000004-0000-0000-0000-000000000000",
    question: "Which type of content is best suited for a 500–2,000 word format?",
    question_type: "multiple_choice",
    options: [
      "Social media captions",
      "Blog posts",
      "SMS messages",
      "Push notifications",
    ],
    correct_answer: "Blog posts",
    explanation: "Blog posts typically range from 500–2,000 words and are designed for depth and SEO. Social media and push notifications are much shorter formats.",
    order_index: 2,
  },
];
