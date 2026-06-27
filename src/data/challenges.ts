export interface SeedChallenge {
  id: string;
  title: string;
  description: string;
  instructions: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  xp_reward: number;
  is_active: boolean;
}

export const SEED_CHALLENGES: SeedChallenge[] = [
  {
    id: "ch-001",
    title: "Write a Product Description",
    description: "Use AI to write a compelling product description for a Kenyan-made product.",
    instructions: `**Your Challenge:**\n\nWrite a product description for a bag of premium Kenyan coffee.\n\n**Requirements:**\n- Between 80–120 words\n- Highlight the product's unique benefits\n- Include a compelling call-to-action\n- Use AI tools to help you write it\n- Edit the AI output to make it sound authentic\n\n**Evaluation Criteria:**\n- Clarity and professionalism\n- Benefit-focused writing\n- Engaging and persuasive tone\n- Proper grammar and spelling\n\n**Hint:** Use a prompt like: "Write a product description for premium Kenyan single-origin coffee. Highlight the rich aroma, ethical sourcing, and smooth taste. Include a call-to-action."`,
    category: "Content Writing",
    difficulty: "easy",
    xp_reward: 100,
    is_active: true,
  },
  {
    id: "ch-002",
    title: "Create a Social Media Caption",
    description: "Write an engaging Instagram caption for a local African business.",
    instructions: `**Your Challenge:**\n\nCreate an Instagram caption for a Nairobi-based fashion brand launching a new collection.\n\n**Requirements:**\n- Maximum 150 characters for the main hook\n- Include 5–8 relevant hashtags\n- Add an emoji or two\n- End with a question or CTA to drive engagement\n\n**Context for the Post:**\n- Brand: "Savanna Style"\n- New collection: "Heritage Collection" inspired by Maasai patterns\n- Launch date: This weekend\n- Vibe: Bold, proud, modern African\n\n**Hint:** Use AI to generate 5 options then pick the best one and refine it.`,
    category: "Social Media",
    difficulty: "easy",
    xp_reward: 100,
    is_active: true,
  },
  {
    id: "ch-003",
    title: "Handle a Customer Complaint",
    description: "Write a professional response to an unhappy customer.",
    instructions: `**Your Challenge:**\n\nA customer has sent the following complaint. Write a professional, empathetic response.\n\n**Customer Message:**\n"I ordered your product 2 weeks ago and it still hasn't arrived. I've tried calling but no one picks up. This is very disappointing and I want a full refund. I will never shop here again."\n\n**Requirements:**\n- Acknowledge the customer's frustration\n- Apologise sincerely\n- Offer a clear solution (refund OR replacement)\n- Provide a specific timeline\n- End on a positive note\n- Keep it under 200 words\n- Professional but warm tone\n\n**Hint:** Use ChatGPT with the customer support agent role to draft your reply.`,
    category: "Customer Support",
    difficulty: "easy",
    xp_reward: 100,
    is_active: true,
  },
  {
    id: "ch-004",
    title: "Summarise a Business Article",
    description: "Find a business article and summarise it using AI tools.",
    instructions: `**Your Challenge:**\n\nFind any business or technology article from a reputable source (BBC, Forbes, TechCrunch, etc.) and create a professional summary.\n\n**Requirements:**\n- Original article must be at least 500 words\n- Your summary must be 100–150 words\n- Include: main topic, 3 key insights, and why it matters\n- Use AI tools to help structure the summary\n- Add your own perspective in 1–2 sentences\n\n**Format Your Answer:**\n1. Article Title & Source:\n2. Summary (100–150 words):\n3. Your Take:\n\n**Hint:** Paste the article into ChatGPT and ask: "Summarise this article in 3 bullet points, then expand it into a 120-word professional summary for a business newsletter."`,
    category: "Research",
    difficulty: "medium",
    xp_reward: 100,
    is_active: true,
  },
  {
    id: "ch-005",
    title: "Craft a Perfect Prompt",
    description: "Write a detailed prompt that gets professional results from ChatGPT.",
    instructions: `**Your Challenge:**\n\nWrite a prompt that gets ChatGPT to produce a professional weekly email newsletter for a small business.\n\n**Your Prompt Must Include:**\n1. Role assignment for ChatGPT\n2. Context about the business (you choose the type)\n3. Specific content requirements (sections, word count, tone)\n4. Format instructions\n5. Any constraints or rules\n\n**Then:**\nCopy your prompt into ChatGPT and paste the output you received.\n\n**Submission Format:**\n**MY PROMPT:**\n[Your detailed prompt here]\n\n**CHATGPT OUTPUT:**\n[Paste the output you received]\n\n**WHAT WORKED / WHAT I'D CHANGE:**\n[Brief reflection 2–3 sentences]`,
    category: "Prompt Engineering",
    difficulty: "medium",
    xp_reward: 100,
    is_active: true,
  },
  {
    id: "ch-006",
    title: "Build an AI Research Report",
    description: "Create a 3-section research report on an AI topic using AI tools.",
    instructions: `**Your Challenge:**\n\nCreate a mini research report on one of these topics:\n- "The Impact of AI on Jobs in Africa"\n- "How AI is Changing Healthcare in Developing Countries"\n- "The Future of Freelancing with AI Tools"\n\n**Report Structure:**\n1. **Introduction** (100 words) — what is the topic and why it matters\n2. **Key Findings** (200 words) — 4–5 research-backed insights\n3. **Conclusion** (100 words) — what this means for the future\n\n**Requirements:**\n- Use AI tools for research assistance\n- Include at least 3 real statistics or facts\n- Cite your sources (article title + website)\n- Professional, third-person writing style\n\n**Hint:** Use ChatGPT to research, then ask it to write each section separately for better quality.`,
    category: "Research",
    difficulty: "hard",
    xp_reward: 100,
    is_active: true,
  },
  {
    id: "ch-007",
    title: "Design an Email Campaign",
    description: "Create a 3-email welcome sequence for a new subscriber.",
    instructions: `**Your Challenge:**\n\nDesign a 3-email welcome sequence for a fictional African e-commerce store.\n\n**The Business:**\nName: "AfriShop"\nSells: African arts, crafts, and clothing online\nTarget audience: African diaspora in Europe and North America\n\n**Email 1 — Welcome (Day 1):**\n- Subject line\n- Welcome message\n- What makes AfriShop special\n- CTA: Browse the collection\n\n**Email 2 — Story (Day 3):**\n- Subject line\n- Brand story — why AfriShop exists\n- Artisan spotlight\n- CTA: Meet our artisans\n\n**Email 3 — Offer (Day 7):**\n- Subject line\n- 10% discount for new subscribers\n- Social proof (testimonials)\n- CTA: Shop now with code WELCOME10\n\n**Each email: 150–200 words**`,
    category: "Email Marketing",
    difficulty: "hard",
    xp_reward: 100,
    is_active: true,
  },
];
