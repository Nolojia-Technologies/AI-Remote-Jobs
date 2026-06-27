export interface SeedOpportunity {
  id: string;
  title: string;
  description: string;
  category: "practice_project" | "ai_simulation" | "skill_challenge" | "mock_freelance" | "remote_job";
  required_xp: number;
  required_level: number;
  is_locked: boolean;
  company: string | null;
  location: string | null;
  payout: string | null;
}

export const SEED_OPPORTUNITIES: SeedOpportunity[] = [
  // ─── Practice Projects ──────────────────────────────────────────────────
  {
    id: "opp-001",
    title: "Write 5 Product Descriptions",
    description: "Practice writing product descriptions for a local marketplace using AI tools. Build your portfolio with real examples.",
    category: "practice_project",
    required_xp: 0,
    required_level: 1,
    is_locked: false,
    company: null,
    location: "Remote",
    payout: "Portfolio Project",
  },
  {
    id: "opp-002",
    title: "Create a Social Media Content Calendar",
    description: "Build a complete 30-day content calendar for a fictional brand. Master AI-assisted content planning.",
    category: "practice_project",
    required_xp: 50,
    required_level: 1,
    is_locked: false,
    company: null,
    location: "Remote",
    payout: "Portfolio Project",
  },
  // ─── AI Simulations ─────────────────────────────────────────────────────
  {
    id: "opp-003",
    title: "Customer Support Simulation: TechStore",
    description: "Handle 10 realistic customer support tickets for a fictional tech store. Practice empathy and AI-assisted responses.",
    category: "ai_simulation",
    required_xp: 100,
    required_level: 1,
    is_locked: false,
    company: "AI Hustle Simulation",
    location: "Remote",
    payout: "150 XP",
  },
  {
    id: "opp-004",
    title: "Virtual Assistant Simulation: Busy CEO",
    description: "Manage a full inbox, schedule, and task list for a fictional CEO for one week. Advanced VA simulation.",
    category: "ai_simulation",
    required_xp: 300,
    required_level: 2,
    is_locked: true,
    company: "AI Hustle Simulation",
    location: "Remote",
    payout: "300 XP",
  },
  // ─── Skill Challenges ───────────────────────────────────────────────────
  {
    id: "opp-005",
    title: "SEO Blog Post Challenge",
    description: "Write a 1,000-word blog post optimised for a given keyword. Prove your content writing skills.",
    category: "skill_challenge",
    required_xp: 200,
    required_level: 2,
    is_locked: true,
    company: null,
    location: "Remote",
    payout: "Badge + 200 XP",
  },
  {
    id: "opp-006",
    title: "Prompt Engineering Championship",
    description: "Write 10 prompts that achieve specific outcomes. Judged on creativity and effectiveness.",
    category: "skill_challenge",
    required_xp: 500,
    required_level: 3,
    is_locked: true,
    company: null,
    location: "Remote",
    payout: "Champion Badge + 500 XP",
  },
  // ─── Mock Freelance Tasks ───────────────────────────────────────────────
  {
    id: "opp-007",
    title: "Mock Project: AfriTech Blog Content",
    description: "Write 3 blog posts for a fictional African technology startup. Simulates real Upwork-style project.",
    category: "mock_freelance",
    required_xp: 400,
    required_level: 2,
    is_locked: true,
    company: "AfriTech (Simulation)",
    location: "Remote",
    payout: "Mock $75 + Portfolio Piece",
  },
  {
    id: "opp-008",
    title: "Mock Project: Social Media Manager",
    description: "Manage social media for a Nairobi restaurant for one month. Create content, schedule posts, respond to comments.",
    category: "mock_freelance",
    required_xp: 600,
    required_level: 3,
    is_locked: true,
    company: "Taste of Nairobi (Simulation)",
    location: "Remote",
    payout: "Mock $120/month + Certificate",
  },
  // ─── Remote Jobs (Future) ───────────────────────────────────────────────
  {
    id: "opp-009",
    title: "AI Content Writer — Remote",
    description: "Join our talent pool for real remote content writing opportunities. Complete all beginner and intermediate modules to unlock.",
    category: "remote_job",
    required_xp: 1000,
    required_level: 4,
    is_locked: true,
    company: "AI Hustle Partner Network",
    location: "Fully Remote",
    payout: "$400–$800/month",
  },
  {
    id: "opp-010",
    title: "AI Virtual Assistant — Part-Time",
    description: "Real part-time virtual assistant role for international clients. Requires strong AI skills and professional portfolio.",
    category: "remote_job",
    required_xp: 1500,
    required_level: 5,
    is_locked: true,
    company: "AI Hustle Partner Network",
    location: "Fully Remote",
    payout: "$600–$1,200/month",
  },
];
