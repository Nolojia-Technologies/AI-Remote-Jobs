-- ============================================================
-- AI Hustle Academy — Seed Data
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- CAREER PATHS  (TEXT primary key — no UUID issue)
-- ─────────────────────────────────────────────────────────────
INSERT INTO career_paths (id, title, description, icon, color, is_active) VALUES
  ('ai-content-writer',       'AI Content Writer',           'Create compelling content using AI tools for blogs, websites, and marketing materials.', 'pen-line',    '#8B5CF6', true),
  ('ai-virtual-assistant',    'AI Virtual Assistant',        'Assist businesses remotely using AI tools to manage tasks, emails, and schedules.',        'bot',         '#0EA5E9', true),
  ('ai-customer-support',     'AI Customer Support Agent',   'Provide exceptional customer service powered by AI automation and smart responses.',       'headphones',  '#22C55E', true),
  ('ai-research-assistant',   'AI Research Assistant',       'Conduct deep research and analysis using AI tools for businesses and academics.',           'search',      '#F59E0B', true),
  ('ai-social-media-manager', 'AI Social Media Manager',     'Grow and manage social media presence using AI-powered content and analytics.',             'share-2',     '#EC4899', true),
  ('prompt-engineer',         'Prompt Engineer',             'Design and optimize AI prompts to get the best results from large language models.',        'code-2',      '#EF4444', true),
  ('data-entry-specialist',   'Data Entry Specialist',       'Handle data processing and entry tasks efficiently using AI tools and automation.',         'database',    '#14B8A6', true);

-- ─────────────────────────────────────────────────────────────
-- ACHIEVEMENTS
-- ─────────────────────────────────────────────────────────────
INSERT INTO achievements (title, description, icon, badge_color, xp_reward, requirement_type, requirement_value) VALUES
  ('First Steps',         'Complete your first lesson',              '🌱', '#22C55E', 100, 'xp',            20),
  ('Quick Learner',       'Complete 5 lessons',                      '📚', '#0EA5E9', 100, 'xp',            100),
  ('Century Club',        'Earn 100 XP',                             '💯', '#F59E0B', 100, 'xp',            100),
  ('Rising Star',         'Earn 500 XP',                             '⭐', '#F59E0B', 100, 'xp',            500),
  ('AI Apprentice',       'Earn 1,000 XP',                           '🤖', '#8B5CF6', 100, 'xp',            1000),
  ('AI Master',           'Earn 5,000 XP',                           '🏆', '#F59E0B', 200, 'xp',            5000),
  ('Streak Starter',      'Maintain a 3-day streak',                 '🔥', '#EF4444', 100, 'streak',        3),
  ('Week Warrior',        'Maintain a 7-day streak',                 '🔥', '#EF4444', 250, 'streak',        7),
  ('Two Week Titan',      'Maintain a 14-day streak',                '💪', '#EF4444', 500, 'streak',        14),
  ('Monthly Master',      'Maintain a 30-day streak',                '🌟', '#F59E0B', 1000,'streak',        30),
  ('Level 2',             'Reach Level 2',                           '2️⃣', '#22C55E', 100, 'level',         2),
  ('Level 5',             'Reach Level 5',                           '5️⃣', '#0EA5E9', 200, 'level',         5),
  ('Level 10',            'Reach Level 10',                          '🔟', '#EF4444', 500, 'level',         10),
  ('Challenge Accepted',  'Complete your first challenge',           '⚡', '#F59E0B', 100, 'xp',            100),
  ('Challenge Champion',  'Complete 10 challenges',                  '👑', '#F59E0B', 300, 'xp',            1000),
  ('Quiz Champion',       'Pass your first quiz',                    '🧠', '#8B5CF6', 100, 'xp',            50);

-- ─────────────────────────────────────────────────────────────
-- MODULE UUIDs used throughout this seed file:
--
--  AI Virtual Assistant:
--    a0000001-0000-0000-0000-000000000000  (Intro to AI Tools)
--    a0000002-0000-0000-0000-000000000000  (Mastering ChatGPT)
--    a0000003-0000-0000-0000-000000000000  (Email & Calendar)
--    a0000004-0000-0000-0000-000000000000  (Customer Support)
--    a0000005-0000-0000-0000-000000000000  (Research)
--
--  Prompt Engineer:
--    b0000001-0000-0000-0000-000000000000  (What Is PE?)
--    b0000002-0000-0000-0000-000000000000  (Prompt Design)
--    b0000003-0000-0000-0000-000000000000  (Advanced Techniques)
--
--  AI Content Writer:
--    c0000001-0000-0000-0000-000000000000  (Content Fundamentals)
--    c0000002-0000-0000-0000-000000000000  (AI Writing Tools)
--    c0000003-0000-0000-0000-000000000000  (SEO & Strategy)
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- MODULES — AI Virtual Assistant
-- ─────────────────────────────────────────────────────────────
INSERT INTO modules (id, career_path_id, title, description, level, order_index, xp_reward, is_active) VALUES
  ('a0000001-0000-0000-0000-000000000000', 'ai-virtual-assistant', 'Introduction to AI Tools',    'Learn the foundations of AI and how virtual assistants use it.',           'beginner',     1, 100, true),
  ('a0000002-0000-0000-0000-000000000000', 'ai-virtual-assistant', 'Mastering ChatGPT',           'Deep dive into ChatGPT for professional tasks.',                           'beginner',     2, 150, true),
  ('a0000003-0000-0000-0000-000000000000', 'ai-virtual-assistant', 'Email & Calendar Management', 'Handle professional communications with AI assistance.',                  'intermediate', 3, 200, true),
  ('a0000004-0000-0000-0000-000000000000', 'ai-virtual-assistant', 'Customer Support with AI',    'Deliver excellent customer experiences using AI tools.',                   'intermediate', 4, 200, true),
  ('a0000005-0000-0000-0000-000000000000', 'ai-virtual-assistant', 'Research & Data Collection',  'Conduct professional research using AI tools.',                            'advanced',     5, 300, true);

-- ─────────────────────────────────────────────────────────────
-- MODULES — Prompt Engineer
-- ─────────────────────────────────────────────────────────────
INSERT INTO modules (id, career_path_id, title, description, level, order_index, xp_reward, is_active) VALUES
  ('b0000001-0000-0000-0000-000000000000', 'prompt-engineer', 'What Is Prompt Engineering?',   'Understanding LLMs and how prompts control their output.',                 'beginner',     1, 100, true),
  ('b0000002-0000-0000-0000-000000000000', 'prompt-engineer', 'Prompt Design Fundamentals',    'Structure, tone, context, and constraints in prompts.',                   'beginner',     2, 150, true),
  ('b0000003-0000-0000-0000-000000000000', 'prompt-engineer', 'Advanced Prompting Techniques', 'Chain-of-thought, few-shot, and system prompts.',                         'intermediate', 3, 250, true);

-- ─────────────────────────────────────────────────────────────
-- MODULES — AI Content Writer
-- ─────────────────────────────────────────────────────────────
INSERT INTO modules (id, career_path_id, title, description, level, order_index, xp_reward, is_active) VALUES
  ('c0000001-0000-0000-0000-000000000000', 'ai-content-writer', 'Content Writing Fundamentals', 'Understand what makes great digital content.',                            'beginner',     1, 100, true),
  ('c0000002-0000-0000-0000-000000000000', 'ai-content-writer', 'AI Writing Tools Mastery',     'Master ChatGPT, Jasper, and other AI writing tools.',                     'beginner',     2, 150, true),
  ('c0000003-0000-0000-0000-000000000000', 'ai-content-writer', 'SEO & Content Strategy',       'Write content that ranks and converts.',                                  'intermediate', 3, 250, true);

-- ─────────────────────────────────────────────────────────────
-- LESSONS — Module: Intro to AI Tools (a0000001)
-- ─────────────────────────────────────────────────────────────
INSERT INTO lessons (id, module_id, title, content, duration_minutes, order_index, xp_reward, is_active) VALUES
  (
    'd0000001-0000-0000-0000-000000000000',
    'a0000001-0000-0000-0000-000000000000',
    'What is Artificial Intelligence?',
    E'# What is Artificial Intelligence?\n\nArtificial Intelligence (AI) is the simulation of human intelligence in machines programmed to think and learn.\n\n## Key Concepts\n\n**Machine Learning** — Algorithms that improve through experience\n**Natural Language Processing** — AI understanding human language\n**Computer Vision** — AI interpreting images and video\n\n## Why AI for Remote Work?\n\nAI tools allow individuals anywhere in the world to:\n- Complete tasks faster and with higher quality\n- Compete with top professionals globally\n- Build skills that are in high demand\n- Work for international clients from home\n\n## Top AI Tools You Will Learn\n\n1. **ChatGPT** — conversational AI for writing, research, coding\n2. **Claude** — advanced reasoning and long-form content\n3. **Gemini** — Google multimodal AI\n4. **Midjourney** — AI image generation\n5. **Notion AI** — productivity and organisation\n\n## Your First Step\n\nThe most important thing is to START. Sign up for a free ChatGPT account today and explore what it can do for you.',
    5, 1, 20, true
  ),
  (
    'd0000002-0000-0000-0000-000000000000',
    'a0000001-0000-0000-0000-000000000000',
    'The Remote Work Revolution',
    E'# The Remote Work Revolution\n\nThe world of work has fundamentally changed. Today, a talented individual in Nairobi or Doha can serve clients in New York or London.\n\n## Market Opportunity\n\nThe global remote work market is worth **$1.5 trillion** and growing. AI-skilled workers are among the highest earners.\n\n## What Clients Need\n\nBusinesses worldwide need people who can:\n- Manage AI tools efficiently\n- Create content at scale\n- Handle customer interactions 24/7\n- Process data quickly and accurately\n\n## Income Potential\n\nEntry-level AI virtual assistants earn:\n- **$5–$15/hour** on platforms like Upwork\n- **$400–$1,200/month** in ongoing contracts\n- Higher as you build your portfolio\n\n## Platforms to Find Work\n\n- Upwork\n- Fiverr\n- Toptal\n- LinkedIn\n- We Work Remotely',
    6, 2, 20, true
  ),
  (
    'd0000003-0000-0000-0000-000000000000',
    'a0000001-0000-0000-0000-000000000000',
    'Setting Up Your AI Toolkit',
    E'# Setting Up Your AI Toolkit\n\nA professional AI worker needs the right tools.\n\n## Essential Free Tools\n\n### 1. ChatGPT\nYour primary AI assistant. Visit chat.openai.com and create a free account.\n\n### 2. Google Workspace (Free)\n- Gmail for professional email\n- Google Docs for documents\n- Google Sheets for data\n- Google Drive for storage\n\n### 3. Notion (Free tier)\n- Task management\n- Note-taking\n- Client documentation\n\n### 4. Canva (Free tier)\n- Design graphics and presentations\n- Build a professional portfolio\n\n## Action Steps\n1. Create all accounts above\n2. Complete your LinkedIn profile\n3. Practice using ChatGPT for 30 minutes daily',
    8, 3, 20, true
  );

-- ─────────────────────────────────────────────────────────────
-- LESSONS — Module: Mastering ChatGPT (a0000002)
-- ─────────────────────────────────────────────────────────────
INSERT INTO lessons (id, module_id, title, content, duration_minutes, order_index, xp_reward, is_active) VALUES
  (
    'd0000004-0000-0000-0000-000000000000',
    'a0000002-0000-0000-0000-000000000000',
    'ChatGPT Fundamentals',
    E'# ChatGPT Fundamentals\n\nChatGPT is the most powerful tool in your AI arsenal. Mastering it sets you apart from 99% of workers.\n\n## Understanding the Interface\n\n- **New Chat** — Start a fresh conversation\n- **System Prompt** — Give ChatGPT context about your role\n- **Conversation History** — Previous chats saved for reference\n\n## Writing Great Prompts: The RCTF Method\n\n- **R**ole — Tell ChatGPT what role to play\n- **C**ontext — Provide background information\n- **T**ask — Clearly state what you want\n- **F**ormat — Specify the output format\n\n## Example: Writing an Email\n\n❌ **Bad Prompt:** "Write an email about a meeting"\n\n✅ **Good Prompt:** "You are a professional executive assistant. Write a formal email to a client named James rescheduling our meeting from Tuesday 3pm to Thursday 2pm. Keep it under 150 words, professional but friendly."\n\n## Practice Exercise\n\nWrite 5 different prompts using the RCTF method for:\n1. Customer support reply\n2. Blog post introduction\n3. Meeting summary\n4. Product description\n5. Social media caption',
    10, 1, 20, true
  ),
  (
    'd0000005-0000-0000-0000-000000000000',
    'a0000002-0000-0000-0000-000000000000',
    'Advanced ChatGPT Techniques',
    E'# Advanced ChatGPT Techniques\n\nOnce you have mastered basic prompts, these advanced techniques will make you a true AI professional.\n\n## 1. Chain Prompting\n\nBreak complex tasks into a series of prompts:\n- Step 1: Research the topic\n- Step 2: Create an outline\n- Step 3: Write each section\n- Step 4: Edit and refine\n\n## 2. Persona Assignment\n\nAssign ChatGPT a specific persona for consistent results:\n"You are a senior marketing copywriter with 10 years of experience writing for e-commerce brands in Africa."\n\n## 3. Constraints and Rules\n\nAdd rules to control output:\n- "Do not use passive voice"\n- "Keep sentences under 20 words"\n- "Always include a call-to-action"\n\n## 4. Iteration and Refinement\n\nNever accept the first output. Always:\n1. Review the response\n2. Identify what to improve\n3. Ask ChatGPT to refine: "Rewrite this but make it more conversational"\n\n## Golden Rule\n\n**AI generates. YOU create.** Always edit, verify facts, and add your personal insight.',
    12, 2, 20, true
  );

-- ─────────────────────────────────────────────────────────────
-- LESSONS — Module: What Is Prompt Engineering (b0000001)
-- ─────────────────────────────────────────────────────────────
INSERT INTO lessons (id, module_id, title, content, duration_minutes, order_index, xp_reward, is_active) VALUES
  (
    'd0000006-0000-0000-0000-000000000000',
    'b0000001-0000-0000-0000-000000000000',
    'How Large Language Models Work',
    E'# How Large Language Models Work\n\nTo write great prompts, you must understand what happens inside the model.\n\n## What Is an LLM?\n\nA Large Language Model (LLM) is a neural network trained on massive amounts of text data. It predicts the next most likely word given the context.\n\n## Key Concepts\n\n### Tokens\nLLMs process text as **tokens** — roughly 3/4 of a word. GPT-4 has a context window of 128,000 tokens (~96,000 words).\n\n### Temperature\nControls randomness:\n- **Low (0.1–0.3)** — Focused, deterministic output\n- **Medium (0.5–0.7)** — Balanced creativity\n- **High (0.9–1.0)** — Creative, unpredictable\n\n### Context Window\nEverything in the conversation is the context. The model uses all of it to generate the response.\n\n## Why This Matters for Prompts\n\nUnderstanding tokens helps you:\n- Know when to split long tasks\n- Understand why context gets forgotten in long conversations\n- Optimise prompt length vs quality\n- Choose the right temperature for different tasks\n\n## Key Takeaway\n\nThe model is a prediction machine. Your job as a prompt engineer is to provide context that makes the right prediction obvious.',
    12, 1, 20, true
  );

-- ─────────────────────────────────────────────────────────────
-- LESSONS — Module: Content Writing Fundamentals (c0000001)
-- ─────────────────────────────────────────────────────────────
INSERT INTO lessons (id, module_id, title, content, duration_minutes, order_index, xp_reward, is_active) VALUES
  (
    'd0000007-0000-0000-0000-000000000000',
    'c0000001-0000-0000-0000-000000000000',
    'The Content Writer''s Mindset',
    E'# The Content Writer''s Mindset\n\nGreat content writers think differently. They don''t just write — they solve problems with words.\n\n## What Makes Content Great?\n\n1. **Clarity** — Easy to read and understand\n2. **Value** — Teaches, entertains, or inspires\n3. **Relevance** — Answers what the reader is searching for\n4. **Action** — Moves the reader to do something\n\n## Types of Content You Will Create\n\n- **Blog Posts** — 500–2,000 words, SEO-focused\n- **Social Media Posts** — Short, punchy, engaging\n- **Email Newsletters** — Personal, direct, valuable\n- **Product Descriptions** — Benefit-focused, conversion-driven\n- **Video Scripts** — Spoken word, conversational\n- **Website Copy** — Clear, trust-building\n\n## The AI Advantage\n\nWith AI, a skilled writer can produce:\n- 10x more content in the same time\n- Consistent quality across all pieces\n- Content in multiple styles and tones\n- Research-backed articles quickly\n\n## Your Golden Rule\n\n**AI generates. YOU create.**\n\nNever publish raw AI output. Always:\n1. Edit for tone and voice\n2. Add personal insights\n3. Verify all facts\n4. Optimise for the reader',
    7, 1, 20, true
  );

-- ─────────────────────────────────────────────────────────────
-- QUIZ UUIDs:
--   e0000001 — AI Foundations Quiz      (module a0000001)
--   e0000002 — ChatGPT Mastery Quiz     (module a0000002)
--   e0000003 — LLM Fundamentals Quiz    (module b0000001)
--   e0000004 — Content Writing Basics   (module c0000001)
-- ─────────────────────────────────────────────────────────────
INSERT INTO quizzes (id, module_id, title, description, pass_score, xp_reward, time_limit_seconds, is_active) VALUES
  ('e0000001-0000-0000-0000-000000000000', 'a0000001-0000-0000-0000-000000000000', 'AI Foundations Quiz',    'Test your understanding of AI basics and remote work opportunities.', 80, 50, 300, true),
  ('e0000002-0000-0000-0000-000000000000', 'a0000002-0000-0000-0000-000000000000', 'ChatGPT Mastery Quiz',   'Prove your ChatGPT skills with practical scenarios.',                 80, 50, 360, true),
  ('e0000003-0000-0000-0000-000000000000', 'b0000001-0000-0000-0000-000000000000', 'LLM Fundamentals Quiz',  'Test your knowledge of how large language models work.',              80, 50, 300, true),
  ('e0000004-0000-0000-0000-000000000000', 'c0000001-0000-0000-0000-000000000000', 'Content Writing Basics', 'Assess your understanding of content writing principles.',            80, 50, 300, true);

-- ─────────────────────────────────────────────────────────────
-- QUIZ QUESTIONS — e0000001 (AI Foundations)
-- ─────────────────────────────────────────────────────────────
INSERT INTO quiz_questions (quiz_id, question, question_type, options, correct_answer, explanation, order_index) VALUES
  (
    'e0000001-0000-0000-0000-000000000000',
    'What does AI stand for?',
    'multiple_choice',
    '["Automated Intelligence","Artificial Intelligence","Advanced Interface","Automated Internet"]',
    'Artificial Intelligence',
    'AI stands for Artificial Intelligence — the simulation of human intelligence in machines.',
    1
  ),
  (
    'e0000001-0000-0000-0000-000000000000',
    'Which of the following is NOT an AI tool?',
    'multiple_choice',
    '["ChatGPT","Midjourney","Photoshop","Claude"]',
    'Photoshop',
    'Photoshop is a traditional design tool. ChatGPT, Midjourney, and Claude are all AI tools.',
    2
  ),
  (
    'e0000001-0000-0000-0000-000000000000',
    'An AI virtual assistant can only work for clients in the same country.',
    'true_false',
    '["True","False"]',
    'False',
    'AI virtual assistants work remotely — they can serve clients anywhere in the world!',
    3
  ),
  (
    'e0000001-0000-0000-0000-000000000000',
    'Entry-level AI virtual assistants can realistically earn how much per month?',
    'multiple_choice',
    '["$50–$100/month","$400–$1,200/month","$5,000–$10,000/month","Nothing — it is all volunteer work"]',
    '$400–$1,200/month',
    'Entry-level AI virtual assistants typically earn $400–$1,200/month in ongoing contracts, growing with experience.',
    4
  ),
  (
    'e0000001-0000-0000-0000-000000000000',
    'Which platform is best suited for finding remote AI work?',
    'multiple_choice',
    '["Facebook Marketplace","Upwork","eBay","Craigslist"]',
    'Upwork',
    'Upwork is the leading platform for remote freelance work, connecting skilled AI professionals with global clients.',
    5
  );

-- ─────────────────────────────────────────────────────────────
-- QUIZ QUESTIONS — e0000002 (ChatGPT Mastery)
-- ─────────────────────────────────────────────────────────────
INSERT INTO quiz_questions (quiz_id, question, question_type, options, correct_answer, explanation, order_index) VALUES
  (
    'e0000002-0000-0000-0000-000000000000',
    'What does RCTF stand for in prompt writing?',
    'multiple_choice',
    '["Role, Context, Task, Format","Research, Create, Test, Finalise","Repeat, Check, Test, Fix","Role, Content, Time, Feedback"]',
    'Role, Context, Task, Format',
    'RCTF is a framework for writing effective prompts: Role, Context, Task, Format.',
    1
  ),
  (
    'e0000002-0000-0000-0000-000000000000',
    'You should always publish AI-generated content without editing it.',
    'true_false',
    '["True","False"]',
    'False',
    'Never publish raw AI output. Always edit for tone, verify facts, and add your personal insight.',
    2
  ),
  (
    'e0000002-0000-0000-0000-000000000000',
    'Which is the better prompt for writing a customer email?',
    'scenario',
    '["Write an email","You are a professional assistant. Write a 150-word email to reschedule a meeting from Tuesday 3pm to Thursday 2pm with client John. Professional but friendly.","Email about meeting","Fix my email"]',
    'You are a professional assistant. Write a 150-word email to reschedule a meeting from Tuesday 3pm to Thursday 2pm with client John. Professional but friendly.',
    'This prompt uses the RCTF method — it gives ChatGPT a role, context, a specific task, and format requirements.',
    3
  ),
  (
    'e0000002-0000-0000-0000-000000000000',
    'What is "chain prompting"?',
    'multiple_choice',
    '["Asking the same question repeatedly","Breaking a complex task into a series of connected prompts","Writing very long prompts","Using multiple AI tools at once"]',
    'Breaking a complex task into a series of connected prompts',
    'Chain prompting breaks complex tasks into steps — e.g., research → outline → write → edit — for better quality results.',
    4
  );

-- ─────────────────────────────────────────────────────────────
-- QUIZ QUESTIONS — e0000003 (LLM Fundamentals)
-- ─────────────────────────────────────────────────────────────
INSERT INTO quiz_questions (quiz_id, question, question_type, options, correct_answer, explanation, order_index) VALUES
  (
    'e0000003-0000-0000-0000-000000000000',
    'What is a "token" in the context of large language models?',
    'multiple_choice',
    '["A cryptocurrency for paying AI services","Roughly 3/4 of a word — the unit LLMs use to process text","A security password for API access","A complete sentence"]',
    'Roughly 3/4 of a word — the unit LLMs use to process text',
    'LLMs process text as tokens, where one token is approximately 3/4 of a word.',
    1
  ),
  (
    'e0000003-0000-0000-0000-000000000000',
    'Which temperature setting would you use for a factual report that must be accurate?',
    'multiple_choice',
    '["0.9 — high temperature","0.1–0.3 — low temperature","1.5 — maximum temperature","Temperature does not affect accuracy"]',
    '0.1–0.3 — low temperature',
    'Low temperature (0.1–0.3) produces focused, deterministic output — ideal for factual content.',
    2
  ),
  (
    'e0000003-0000-0000-0000-000000000000',
    'An LLM is essentially a sophisticated prediction machine for the next word.',
    'true_false',
    '["True","False"]',
    'True',
    'At its core, an LLM predicts the most likely next token given the context. Great prompts make the desired prediction obvious.',
    3
  );

-- ─────────────────────────────────────────────────────────────
-- QUIZ QUESTIONS — e0000004 (Content Writing Basics)
-- ─────────────────────────────────────────────────────────────
INSERT INTO quiz_questions (quiz_id, question, question_type, options, correct_answer, explanation, order_index) VALUES
  (
    'e0000004-0000-0000-0000-000000000000',
    'What is the "Golden Rule" of AI content writing?',
    'multiple_choice',
    '["AI writes everything automatically — no editing needed","AI generates. YOU create. Always edit and verify AI output.","Never use AI for professional content","Always use the longest possible AI output"]',
    'AI generates. YOU create. Always edit and verify AI output.',
    'AI is a tool to enhance your writing, not replace your judgment. Always edit for tone, verify facts, and add insight.',
    1
  ),
  (
    'e0000004-0000-0000-0000-000000000000',
    'Which type of content is best suited for a 500–2,000 word format?',
    'multiple_choice',
    '["Social media captions","Blog posts","SMS messages","Push notifications"]',
    'Blog posts',
    'Blog posts typically range from 500–2,000 words and are designed for depth and SEO. Social media is much shorter.',
    2
  ),
  (
    'e0000004-0000-0000-0000-000000000000',
    'AI content writers only need to know how to use one AI tool.',
    'true_false',
    '["True","False"]',
    'False',
    'Professional AI content writers use multiple tools — ChatGPT for writing, Canva for visuals, Grammarly for editing, and more.',
    3
  );

-- ─────────────────────────────────────────────────────────────
-- CHALLENGES (expires 30 days from seed time)
-- ─────────────────────────────────────────────────────────────
INSERT INTO challenges (title, description, instructions, category, difficulty, xp_reward, expires_at, is_active) VALUES
  (
    'Write a Product Description',
    'Use AI to write a compelling product description for a Kenyan-made product.',
    E'**Your Challenge:**\n\nWrite a product description for a bag of premium Kenyan coffee.\n\n**Requirements:**\n- Between 80–120 words\n- Highlight the product''s unique benefits\n- Include a compelling call-to-action\n- Use AI tools to help you write it\n- Edit the AI output to sound authentic\n\n**Evaluation Criteria:**\n- Clarity and professionalism\n- Benefit-focused writing\n- Engaging and persuasive tone\n- Proper grammar\n\n**Hint:** Prompt: "Write a product description for premium Kenyan single-origin coffee. Highlight rich aroma, ethical sourcing, and smooth taste."',
    'Content Writing', 'easy', 100, NOW() + INTERVAL '30 days', true
  ),
  (
    'Create a Social Media Caption',
    'Write an engaging Instagram caption for a local African business.',
    E'**Your Challenge:**\n\nCreate an Instagram caption for a Nairobi fashion brand launching a new collection.\n\n**Requirements:**\n- Maximum 150 characters for the main hook\n- Include 5–8 relevant hashtags\n- Add an emoji or two\n- End with a question or CTA to drive engagement\n\n**Context:**\n- Brand: Savanna Style\n- Collection: Heritage Collection (Maasai-inspired)\n- Vibe: Bold, proud, modern African\n\n**Hint:** Use AI to generate 5 options then pick and refine the best one.',
    'Social Media', 'easy', 100, NOW() + INTERVAL '30 days', true
  ),
  (
    'Handle a Customer Complaint',
    'Write a professional response to an unhappy customer.',
    E'**Customer Message:**\n"I ordered your product 2 weeks ago and it still has not arrived. I have tried calling but no one picks up. This is very disappointing and I want a full refund."\n\n**Requirements:**\n- Acknowledge the customer''s frustration\n- Apologise sincerely\n- Offer a clear solution (refund OR replacement)\n- Provide a specific timeline\n- End on a positive note\n- Under 200 words, professional but warm tone\n\n**Hint:** Use ChatGPT with a customer support agent role to draft your reply.',
    'Customer Support', 'easy', 100, NOW() + INTERVAL '30 days', true
  ),
  (
    'Summarise a Business Article',
    'Find a business article and summarise it using AI tools.',
    E'**Requirements:**\n- Original article must be at least 500 words\n- Your summary: 100–150 words\n- Include: main topic, 3 key insights, and why it matters\n- Use AI tools to help structure the summary\n- Add your own perspective in 1–2 sentences\n\n**Format Your Answer:**\n1. Article Title & Source:\n2. Summary (100–150 words):\n3. Your Take:\n\n**Hint:** Paste the article into ChatGPT and ask: "Summarise this article in 3 bullet points, then expand into a 120-word professional summary."',
    'Research', 'medium', 100, NOW() + INTERVAL '30 days', true
  ),
  (
    'Craft a Perfect Prompt',
    'Write a detailed prompt that gets professional results from ChatGPT.',
    E'**Your Challenge:**\n\nWrite a prompt that gets ChatGPT to produce a professional weekly email newsletter for a small business.\n\n**Your Prompt Must Include:**\n1. Role assignment for ChatGPT\n2. Context about the business (you choose the type)\n3. Specific content requirements (sections, word count, tone)\n4. Format instructions\n5. Any constraints or rules\n\n**Then:** Copy your prompt into ChatGPT and paste the output you received.\n\n**Submission Format:**\nMY PROMPT:\n[Your detailed prompt]\n\nCHATGPT OUTPUT:\n[Paste the output]\n\nWHAT WORKED / WHAT I WOULD CHANGE:\n[Brief reflection, 2–3 sentences]',
    'Prompt Engineering', 'medium', 100, NOW() + INTERVAL '30 days', true
  ),
  (
    'Build an AI Research Report',
    'Create a 3-section research report on an AI topic.',
    E'**Choose one topic:**\n- "The Impact of AI on Jobs in Africa"\n- "How AI is Changing Healthcare in Developing Countries"\n- "The Future of Freelancing with AI Tools"\n\n**Report Structure:**\n1. Introduction (100 words) — what the topic is and why it matters\n2. Key Findings (200 words) — 4–5 research-backed insights\n3. Conclusion (100 words) — what this means for the future\n\n**Requirements:**\n- Include at least 3 real statistics or facts\n- Cite your sources (article title + website)\n- Professional, third-person writing style\n\n**Hint:** Use ChatGPT to research each section separately for better quality.',
    'Research', 'hard', 100, NOW() + INTERVAL '30 days', true
  ),
  (
    'Design an Email Campaign',
    'Create a 3-email welcome sequence for a new subscriber.',
    E'**Create a 3-email welcome sequence for AfriShop** — an African arts and crafts e-commerce store.\n\n**Email 1 — Welcome (Day 1):**\n- Subject line + Welcome message + What makes AfriShop special + CTA: Browse the collection\n\n**Email 2 — Story (Day 3):**\n- Subject line + Brand story + Artisan spotlight + CTA: Meet our artisans\n\n**Email 3 — Offer (Day 7):**\n- Subject line + 10% discount + Social proof + CTA: Shop now with code WELCOME10\n\n**Each email: 150–200 words**\n\nTarget audience: African diaspora in Europe and North America.',
    'Email Marketing', 'hard', 100, NOW() + INTERVAL '30 days', true
  );

-- ─────────────────────────────────────────────────────────────
-- OPPORTUNITIES
-- ─────────────────────────────────────────────────────────────
INSERT INTO opportunities (title, description, category, required_xp, required_level, is_locked, company, location, payout) VALUES
  ('Write 5 Product Descriptions',
   'Practice writing product descriptions for a local marketplace using AI tools. Build your portfolio with real examples.',
   'practice_project', 0, 1, false, NULL, 'Remote', 'Portfolio Project'),

  ('Create a Social Media Content Calendar',
   'Build a complete 30-day content calendar for a fictional brand. Master AI-assisted content planning.',
   'practice_project', 50, 1, false, NULL, 'Remote', 'Portfolio Project'),

  ('Customer Support Simulation: TechStore',
   'Handle 10 realistic customer support tickets for a fictional tech store. Practice empathy and AI-assisted responses.',
   'ai_simulation', 100, 1, false, 'AI Hustle Simulation', 'Remote', '150 XP'),

  ('Virtual Assistant Simulation: Busy CEO',
   'Manage a full inbox, schedule, and task list for a fictional CEO for one week. Advanced VA simulation.',
   'ai_simulation', 300, 2, true, 'AI Hustle Simulation', 'Remote', '300 XP'),

  ('SEO Blog Post Challenge',
   'Write a 1,000-word blog post optimised for a given keyword. Prove your content writing skills.',
   'skill_challenge', 200, 2, true, NULL, 'Remote', 'Badge + 200 XP'),

  ('Prompt Engineering Championship',
   'Write 10 prompts that achieve specific outcomes. Judged on creativity and effectiveness.',
   'skill_challenge', 500, 3, true, NULL, 'Remote', 'Champion Badge + 500 XP'),

  ('Mock Project: AfriTech Blog Content',
   'Write 3 blog posts for a fictional African technology startup. Simulates a real Upwork-style project.',
   'mock_freelance', 400, 2, true, 'AfriTech (Simulation)', 'Remote', 'Mock $75 + Portfolio'),

  ('Mock Project: Social Media Manager',
   'Manage social media for a Nairobi restaurant for one month. Create content, schedule posts, respond to comments.',
   'mock_freelance', 600, 3, true, 'Taste of Nairobi (Simulation)', 'Remote', 'Mock $120/month + Certificate'),

  ('AI Content Writer — Remote',
   'Join our talent pool for real remote content writing opportunities. Complete all beginner and intermediate modules to unlock.',
   'remote_job', 1000, 4, true, 'AI Hustle Partner Network', 'Fully Remote', '$400–$800/month'),

  ('AI Virtual Assistant — Part-Time',
   'Real part-time virtual assistant role for international clients. Requires strong AI skills and professional portfolio.',
   'remote_job', 1500, 5, true, 'AI Hustle Partner Network', 'Fully Remote', '$600–$1,200/month');
