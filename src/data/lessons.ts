export interface SeedLesson {
  id: string;
  module_id: string;
  title: string;
  content: string;
  video_url: string | null;
  duration_minutes: number;
  order_index: number;
  xp_reward: number;
  is_active: boolean;
}

export interface SeedModule {
  id: string;
  career_path_id: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  order_index: number;
  xp_reward: number;
  is_active: boolean;
}

export const SEED_MODULES: SeedModule[] = [
  // ─── AI Virtual Assistant ───────────────────────────────────────────────
  {
    id: "a0000001-0000-0000-0000-000000000000",
    career_path_id: "ai-virtual-assistant",
    title: "Introduction to AI Tools",
    description: "Learn the foundations of AI and how virtual assistants use it.",
    level: "beginner",
    order_index: 1,
    xp_reward: 100,
    is_active: true,
  },
  {
    id: "a0000002-0000-0000-0000-000000000000",
    career_path_id: "ai-virtual-assistant",
    title: "Mastering ChatGPT",
    description: "Deep dive into ChatGPT for professional tasks.",
    level: "beginner",
    order_index: 2,
    xp_reward: 150,
    is_active: true,
  },
  {
    id: "a0000003-0000-0000-0000-000000000000",
    career_path_id: "ai-virtual-assistant",
    title: "Email & Calendar Management",
    description: "Handle professional communications with AI assistance.",
    level: "intermediate",
    order_index: 3,
    xp_reward: 200,
    is_active: true,
  },
  {
    id: "a0000004-0000-0000-0000-000000000000",
    career_path_id: "ai-virtual-assistant",
    title: "Customer Support with AI",
    description: "Deliver excellent customer experiences using AI tools.",
    level: "intermediate",
    order_index: 4,
    xp_reward: 200,
    is_active: true,
  },
  {
    id: "a0000005-0000-0000-0000-000000000000",
    career_path_id: "ai-virtual-assistant",
    title: "Research & Data Collection",
    description: "Conduct professional research using AI tools.",
    level: "advanced",
    order_index: 5,
    xp_reward: 300,
    is_active: true,
  },
  // ─── Prompt Engineer ────────────────────────────────────────────────────
  {
    id: "b0000001-0000-0000-0000-000000000000",
    career_path_id: "prompt-engineer",
    title: "What Is Prompt Engineering?",
    description: "Understanding LLMs and how prompts control their output.",
    level: "beginner",
    order_index: 1,
    xp_reward: 100,
    is_active: true,
  },
  {
    id: "b0000002-0000-0000-0000-000000000000",
    career_path_id: "prompt-engineer",
    title: "Prompt Design Fundamentals",
    description: "Structure, tone, context, and constraints in prompts.",
    level: "beginner",
    order_index: 2,
    xp_reward: 150,
    is_active: true,
  },
  {
    id: "b0000003-0000-0000-0000-000000000000",
    career_path_id: "prompt-engineer",
    title: "Advanced Prompting Techniques",
    description: "Chain-of-thought, few-shot, and system prompts.",
    level: "intermediate",
    order_index: 3,
    xp_reward: 250,
    is_active: true,
  },
  // ─── AI Content Writer ──────────────────────────────────────────────────
  {
    id: "c0000001-0000-0000-0000-000000000000",
    career_path_id: "ai-content-writer",
    title: "Content Writing Fundamentals",
    description: "Understand what makes great digital content.",
    level: "beginner",
    order_index: 1,
    xp_reward: 100,
    is_active: true,
  },
  {
    id: "c0000002-0000-0000-0000-000000000000",
    career_path_id: "ai-content-writer",
    title: "AI Writing Tools Mastery",
    description: "Master ChatGPT, Jasper, and other AI writing tools.",
    level: "beginner",
    order_index: 2,
    xp_reward: 150,
    is_active: true,
  },
  {
    id: "c0000003-0000-0000-0000-000000000000",
    career_path_id: "ai-content-writer",
    title: "SEO & Content Strategy",
    description: "Write content that ranks and converts.",
    level: "intermediate",
    order_index: 3,
    xp_reward: 250,
    is_active: true,
  },
];

export const SEED_LESSONS: SeedLesson[] = [
  // ─── Module: mod-ava-1 ──────────────────────────────────────────────────
  {
    id: "d0000001-0000-0000-0000-000000000000",
    module_id: "a0000001-0000-0000-0000-000000000000",
    title: "What is Artificial Intelligence?",
    content: `# What is Artificial Intelligence?\n\nArtificial Intelligence (AI) is the simulation of human intelligence in machines programmed to think and learn.\n\n## Key Concepts\n\n**Machine Learning** — Algorithms that improve through experience\n**Natural Language Processing** — AI understanding human language\n**Computer Vision** — AI interpreting images and video\n\n## Why AI for Remote Work?\n\nAI tools allow individuals anywhere in the world to:\n- Complete tasks faster and with higher quality\n- Compete with top professionals globally\n- Build skills that are in high demand\n- Work for international clients from home\n\n## Top AI Tools You'll Learn\n\n1. **ChatGPT** — conversational AI for writing, research, coding\n2. **Claude** — advanced reasoning and long-form content\n3. **Gemini** — Google's multimodal AI\n4. **Midjourney** — AI image generation\n5. **Notion AI** — productivity and organisation\n\n## Your First Step\n\nThe most important thing is to START. Sign up for a free ChatGPT account today and explore what it can do for you.`,
    video_url: null,
    duration_minutes: 5,
    order_index: 1,
    xp_reward: 20,
    is_active: true,
  },
  {
    id: "d0000002-0000-0000-0000-000000000000",
    module_id: "a0000001-0000-0000-0000-000000000000",
    title: "The Remote Work Revolution",
    content: `# The Remote Work Revolution\n\nThe world of work has fundamentally changed. Today, a talented individual in Nairobi or Doha can serve clients in New York or London.\n\n## Market Opportunity\n\nThe global remote work market is worth **$1.5 trillion** and growing. AI-skilled workers are among the highest earners.\n\n## What Clients Need\n\nBusinesses worldwide need people who can:\n- Manage AI tools efficiently\n- Create content at scale\n- Handle customer interactions 24/7\n- Process data quickly and accurately\n- Respond to emails and inquiries\n\n## Income Potential\n\nEntry-level AI virtual assistants earn:\n- **$5–$15/hour** on platforms like Upwork\n- **$400–$1,200/month** in ongoing contracts\n- Higher as you build your portfolio\n\n## Platforms to Find Work\n\n- Upwork\n- Fiverr\n- Toptal\n- Remote.co\n- We Work Remotely\n- LinkedIn`,
    video_url: null,
    duration_minutes: 6,
    order_index: 2,
    xp_reward: 20,
    is_active: true,
  },
  {
    id: "d0000003-0000-0000-0000-000000000000",
    module_id: "a0000001-0000-0000-0000-000000000000",
    title: "Setting Up Your AI Toolkit",
    content: `# Setting Up Your AI Toolkit\n\nA professional AI worker needs the right tools. Here is your essential setup.\n\n## Essential Free Tools\n\n### 1. ChatGPT (Free tier available)\nYour primary AI assistant for writing, research, and problem-solving.\n- Visit: chat.openai.com\n- Create free account\n- Explore GPT-3.5 capabilities\n\n### 2. Google Workspace (Free)\n- Gmail for professional email\n- Google Docs for documents\n- Google Sheets for spreadsheets\n- Google Drive for storage\n\n### 3. Notion (Free tier)\n- Task management\n- Note-taking\n- Client documentation\n\n### 4. Canva (Free tier)\n- Design social media graphics\n- Create professional presentations\n- Build portfolios\n\n## Productivity Setup\n\n1. Dedicated workspace\n2. Reliable internet connection\n3. Professional email address\n4. LinkedIn profile\n5. Portfolio website (later)\n\n## Action Steps\n1. Create all accounts above\n2. Complete your LinkedIn profile\n3. Practice using ChatGPT for 30 minutes daily`,
    video_url: null,
    duration_minutes: 8,
    order_index: 3,
    xp_reward: 20,
    is_active: true,
  },
  // ─── Module: mod-ava-2 ──────────────────────────────────────────────────
  {
    id: "d0000004-0000-0000-0000-000000000000",
    module_id: "a0000002-0000-0000-0000-000000000000",
    title: "ChatGPT Fundamentals",
    content: `# ChatGPT Fundamentals\n\nChatGPT is the most powerful tool in your AI arsenal. Mastering it sets you apart from 99% of workers.\n\n## Understanding the Interface\n\n- **New Chat** — Start a fresh conversation\n- **System Prompt** — Give ChatGPT context about your role\n- **Conversation History** — Previous chats saved for reference\n- **GPT-4** — The more powerful model (ChatGPT Plus)\n\n## Writing Great Prompts\n\nThe quality of your output depends on your input. Follow this framework:\n\n**RCTF Method:**\n- **R**ole — Tell ChatGPT what role to play\n- **C**ontext — Provide background information\n- **T**ask — Clearly state what you want\n- **F**ormat — Specify the output format\n\n## Example: Writing an Email\n\n❌ **Bad Prompt:**\n"Write an email about a meeting"\n\n✅ **Good Prompt:**\n"You are a professional executive assistant. Write a formal email to a client named James Odhiambo rescheduling our weekly strategy meeting from Tuesday 3pm to Thursday 2pm. Keep it under 150 words, professional but friendly."\n\n## Practice Exercise\n\nWrite 5 different prompts using the RCTF method for:\n1. Customer support reply\n2. Blog post introduction\n3. Meeting summary\n4. Product description\n5. Social media caption`,
    video_url: null,
    duration_minutes: 10,
    order_index: 1,
    xp_reward: 20,
    is_active: true,
  },
  // ─── Module: mod-pe-1 ───────────────────────────────────────────────────
  {
    id: "d0000006-0000-0000-0000-000000000000",
    module_id: "b0000001-0000-0000-0000-000000000000",
    title: "How Large Language Models Work",
    content: `# How Large Language Models Work\n\nTo write great prompts, you must understand what happens inside the model.\n\n## What Is an LLM?\n\nA Large Language Model (LLM) is a neural network trained on massive amounts of text data. It predicts the next most likely word given the context.\n\n## Key Concepts\n\n### Tokens\nLLMs process text as **tokens** — roughly 3/4 of a word. GPT-4 has a context window of 128,000 tokens (~96,000 words).\n\n### Temperature\nControls randomness:\n- **Low (0.1–0.3)** — Focused, deterministic output\n- **Medium (0.5–0.7)** — Balanced creativity\n- **High (0.9–1.0)** — Creative, unpredictable\n\n### Context Window\nEverything in the conversation is the \"context.\" The model uses all of it to generate the response.\n\n## Why This Matters for Prompts\n\nUnderstanding tokens helps you:\n- Know when to split long tasks\n- Understand why context gets \"forgotten\"\n- Optimise prompt length vs quality\n- Choose the right temperature for tasks\n\n## Key Takeaway\n\nThe model is a prediction machine. Your job as a prompt engineer is to provide context that makes the right prediction obvious.`,
    video_url: null,
    duration_minutes: 12,
    order_index: 1,
    xp_reward: 20,
    is_active: true,
  },
  // ─── Module: mod-acw-1 ──────────────────────────────────────────────────
  {
    id: "d0000007-0000-0000-0000-000000000000",
    module_id: "c0000001-0000-0000-0000-000000000000",
    title: "The Content Writer's Mindset",
    content: `# The Content Writer's Mindset\n\nGreat content writers think differently. They don't just write — they solve problems with words.\n\n## What Makes Content Great?\n\n1. **Clarity** — Easy to read and understand\n2. **Value** — Teaches, entertains, or inspires\n3. **Relevance** — Answers what the reader is searching for\n4. **Action** — Moves the reader to do something\n\n## Types of Content You'll Create\n\n- **Blog Posts** — 500–2,000 words, SEO-focused\n- **Social Media Posts** — Short, punchy, engaging\n- **Email Newsletters** — Personal, direct, valuable\n- **Product Descriptions** — Benefit-focused, conversion-driven\n- **Video Scripts** — Spoken word, conversational\n- **Website Copy** — Clear, trust-building\n\n## The AI Advantage\n\nWith AI, a skilled writer can produce:\n- 10x more content in the same time\n- Consistent quality across all pieces\n- Content in multiple styles and tones\n- Research-backed articles quickly\n\n## Your Golden Rule\n\n**AI generates. YOU create.**\n\nNever publish raw AI output. Always:\n1. Edit for tone and voice\n2. Add personal insights\n3. Verify all facts\n4. Optimise for the reader`,
    video_url: null,
    duration_minutes: 7,
    order_index: 1,
    xp_reward: 20,
    is_active: true,
  },
];
