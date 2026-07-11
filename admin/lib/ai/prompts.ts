// Prompt builders for the layered generation system. Every prompt encodes the
// product quality bar: practical, employable skills for Kenya / Qatar / Africa /
// global remote workers — real-world examples, no generic filler.

const VOICE = `You are an expert curriculum designer for "AI Hustle Academy", a mobile app
that teaches Africans and Middle-Eastern learners (primarily Kenya and Qatar) the
practical AI and remote-work skills employers actually pay for.

Quality bar:
- Teach employable, job-ready skills — not generic theory.
- Use concrete, real-world examples relevant to remote work, freelancing (Upwork/Fiverr), and clients abroad.
- Be specific and actionable. Prefer steps, checklists, scripts, and templates over vague advice.
- Localise where useful (M-Pesa, payment realities, time zones, working with foreign clients), but keep skills globally marketable.
- Write at a clear, encouraging level. Avoid fluff.
Always respond with ONLY valid JSON matching the requested shape. No markdown fences.`;

export function structurePrompt(input: { topic: string; difficulty: string; market: string }) {
  return {
    system: VOICE,
    user: `Design the STRUCTURE for a course.

Topic: ${input.topic}
Difficulty: ${input.difficulty}
Target market: ${input.market}

Produce 5 stages, each with 4 chapters. Mark the last chapter of each stage as a milestone (is_milestone=true).
Return JSON: {
  "course": { "title": string, "description": string (2 sentences), "tags": string[] },
  "stages": [ { "title": string, "description": string, "chapters": [ { "title": string, "description": string, "is_milestone": boolean } ] } ]
}`,
  };
}

export function stagePrompt(input: { courseTitle: string; stageTitle: string; chapters: string[]; difficulty: string; market: string }) {
  return {
    system: VOICE,
    user: `For the course "${input.courseTitle}", generate full content for the stage "${input.stageTitle}".

Chapters in this stage: ${input.chapters.map((c) => `"${c}"`).join(", ")}
Difficulty: ${input.difficulty}. Market: ${input.market}.

For EACH chapter produce 3 lessons and one short mini-challenge (4 questions).
Each lesson body must be rich Markdown with these sections: "## Key concepts", "## Worked example", "## Case study", "## Exercise", "## Tips", "## Common mistakes", "## Resources".
Return JSON: {
  "chapters": [ {
    "title": string,
    "lessons": [ { "title": string, "type": "text", "body": string (markdown) } ],
    "mini_challenge": { "title": string, "questions": [ { "type": "multiple_choice"|"true_false"|"fill_blank"|"scenario", "prompt": string, "options": string[], "answer": string, "explanation": string } ] }
  } ]
}`,
  };
}

export function lessonPrompt(input: { courseTitle: string; chapterTitle: string; lessonTitle: string; market: string }) {
  return {
    system: VOICE,
    user: `Write ONE professional lesson.

Course: "${input.courseTitle}"
Chapter: "${input.chapterTitle}"
Lesson: "${input.lessonTitle}"
Market: ${input.market}

Body must be rich Markdown including: "## Key concepts", "## Worked example", "## Case study", "## Exercise", "## Tips", "## Common mistakes", "## Resources".
Return JSON: { "title": string, "type": "text", "body": string }`,
  };
}

export function restructureLessonPrompt(input: { sourceTitle: string; sourceMarkdown: string; market: string }) {
  return {
    system: VOICE,
    user: `You are RESTRUCTURING existing source material (text extracted from an uploaded PDF) into ONE polished app lesson. This is NOT writing from scratch.

CONTENT FIDELITY — non-negotiable:
- Every fact, figure, definition, name, example and claim in the lesson MUST come from the SOURCE below.
- Do NOT invent facts, statistics, quotes, case studies, tools, or examples that are not present in (or directly implied by) the source.
- If the source has no material for one of our sections, OMIT that section — never fabricate it to fill the template.
- You MAY: fix extraction/OCR artifacts, improve wording and flow, reorder for clarity, add short connective sentences, and write a brief intro and a "Key takeaways" summary drawn strictly from the source.

STRUCTURE — make it feel like a premium native lesson, not a PDF dump:
- Output rich Markdown. Begin with a 1–2 sentence intro (no heading).
- Then use these section headings WHERE THE SOURCE SUPPORTS THEM, in this order: "## Key concepts", "## Worked example", "## Case study", "## Steps", "## Tips", "## Common mistakes", "## Key takeaways", "## Resources".
- ALWAYS include "## Key concepts" and "## Key takeaways". Include the rest only when the source contains relevant material.
- Preserve the source's lists, numbered steps and tables (render tables as Markdown tables).
- Keep it tight and skimmable; aim for ~400–700 words (less if the source is short).
- Localise tone for ${input.market} learners only where natural — never alter the source's facts to do so.

SOURCE TITLE: ${input.sourceTitle}

SOURCE MATERIAL:
"""
${input.sourceMarkdown}
"""

Return JSON: { "title": string (a clear, refined lesson title), "type": "text", "body": string (the restructured Markdown lesson) }`,
  };
}

export function quizPrompt(input: {
  courseTitle: string;
  context: string;
  count: number;
  passingScore: number;
  market: string;
  practical?: boolean;
}) {
  return {
    system: VOICE,
    user: `Write a ${input.count}-question assessment for "${input.courseTitle}" covering: ${input.context}.

Market: ${input.market}. Passing score: ${input.passingScore}%.
Mix question types: multiple_choice (4 options), true_false (options ["True","False"]), fill_blank, and scenario.
${input.practical ? "Include practical scenario questions and short writing/case-study tasks." : ""}
Every question needs the correct "answer" (for multiple_choice it must exactly match one option; for true_false it is "True" or "False") and a one-line "explanation".
Return JSON: { "title": string, "questions": [ { "type": string, "prompt": string, "options": string[], "answer": string, "explanation": string } ] }`,
  };
}

export function certQuestionsPrompt(input: { category: string; topics: string[]; count: number; market: string }) {
  return {
    system: VOICE,
    user: `Generate ${input.count} questions for the GLOBAL "Job Readiness Certification" question bank.

This certification proves a learner genuinely understands the course material and is ready to apply for remote jobs. Questions are auto-graded and drawn at random per attempt, so each must be self-contained and unambiguous.

Focus category: ${input.category}
${input.topics.length ? `Topics to cover: ${input.topics.join(", ")}` : ""}
Market: ${input.market}

Rules:
- Use ONLY these types: "multiple_choice" (4 options), "true_false" (options ["True","False"]), "scenario" (a short real-world situation + 4 options). NO essay/fill-blank.
- "answer" MUST exactly match one of the "options" (for true_false it is "True" or "False").
- Each question needs a one-line "explanation" and a short "topic".
- Vary "difficulty" across beginner→advanced. Make scenarios reflect real freelancing / remote-client situations.
- Keep prompts concise and practical; avoid trick questions and ambiguous wording.

Return JSON: { "questions": [ { "type": string, "prompt": string, "options": string[], "answer": string, "explanation": string, "difficulty": string, "topic": string } ] }`,
  };
}

export function jobsPrompt(input: { count: number; focus: string; market: string }) {
  return {
    system: VOICE,
    user: `Generate ${input.count} realistic REMOTE job listings for the "AI Remote Jobs" app.

${input.focus ? `Focus/theme: ${input.focus}` : "Mix of categories (content writing, virtual assistant, customer support, social media, prompt engineering, data entry, research)."}
Target market: ${input.market}. Roles must be genuinely doable by AI-skilled remote workers in Kenya, Qatar, Africa and the global market — no senior/onsite roles.

For each job provide:
- "title", "company", "description" (1–2 practical sentences)
- "salary_min" & "salary_max": integer MONTHLY amounts with salary_min < salary_max
- "salary_currency" (usually "USD")
- "country" and a matching "country_flag" emoji
- "category" (kebab-case, e.g. ai-content-writing, virtual-assistant, customer-support, social-media, prompt-engineering, data-entry, research)
- "type": one of remote | hybrid | full_time | part_time | freelance
- "difficulty": one of beginner | intermediate | advanced
- "application_url": a plausible URL or null

Return JSON: { "jobs": [ { "title": string, "company": string, "description": string, "salary_min": number, "salary_max": number, "salary_currency": string, "country": string, "country_flag": string, "category": string, "type": string, "difficulty": string, "application_url": string|null } ] }`,
  };
}

export function improvePrompt(input: { title: string; body: string }) {
  return {
    system: VOICE,
    user: `Improve this lesson — make it clearer, more practical, more engaging, and add concrete remote-work examples where helpful. Keep the Markdown section structure.

Title: ${input.title}

${input.body}

Return JSON: { "title": string, "body": string }`,
  };
}

export function translatePrompt(input: { body: string; language: string }) {
  return {
    system: VOICE,
    user: `Translate the following lesson content into ${input.language}. Keep all Markdown structure and formatting intact. Translate naturally for a learner audience.

${input.body}

Return JSON: { "body": string }`,
  };
}

export function thumbnailPrompt(input: { title: string; category: string }) {
  return `A clean, modern, flat-illustration course thumbnail for an online learning app.
Topic: "${input.title}" (category: ${input.category}). Bright, professional, friendly.
Minimal text. Vibrant blue/indigo accent palette. Suitable for a mobile course card.`;
}

export function aiTasksPrompt(input: { count: number; kind: string; focus: string }) {
  return {
    system: VOICE,
    user: `Generate ${input.count} AI earning micro-tasks for the app's "AI Tasks" hub, where users earn small cash rewards for helping improve AI systems.

Task kind: ${input.kind}. ${input.focus ? `Theme/focus: ${input.focus}.` : ""}

Rules:
- "kind": microtask | annotation | survey.
- microtask/annotation: single multiple-choice question with ONE objectively correct answer. Provide "question", 2–4 "options", and "correct_option" (0-based index). Categories: sentiment_analysis, text_classification, prompt_evaluation, chatbot_evaluation, response_rating, ocr_correction, translation_validation, intent_classification (microtask) / image_labeling, object_detection, emotion_labeling, entity_recognition, document_classification (annotation). Image tasks must describe the image with emoji in the question (e.g. "Which animal is shown? 🐘").
- survey: opinion questions with NO correct answer — provide "survey_questions" (3–6 items, each { "q", "options" }) and set correct_option to null.
- "reward_cents": 1–5 for easy, 3–8 for medium, 5–15 for hard, 8–20 for surveys. "xp": 2–10. "est_seconds": realistic (10–60, surveys up to 180).
- Questions must be self-contained, unambiguous, and answerable by anyone (no external context). Vary wording — never repeat the same question.
- Audience: AI-skilled earners in Kenya, Qatar and the global remote market; Swahili/Arabic translation-validation tasks welcome.

Return JSON: { "tasks": [ { "kind", "category", "title", "description", "difficulty", "reward_cents", "xp", "est_seconds", "question", "options", "correct_option", "survey_questions", "min_task_level" } ] }`,
  };
}
