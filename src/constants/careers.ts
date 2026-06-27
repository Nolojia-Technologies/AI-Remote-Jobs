export interface CareerPathConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  emoji: string;
  skills: string[];
}

export const CAREER_PATHS: CareerPathConfig[] = [
  {
    id: "ai-content-writer",
    title: "AI Content Writer",
    description: "Create compelling content using AI tools for blogs, websites, and marketing materials.",
    icon: "pen-line",
    color: "#8B5CF6",
    emoji: "✍️",
    skills: ["ChatGPT", "Content Strategy", "SEO Writing", "Copywriting"],
  },
  {
    id: "ai-virtual-assistant",
    title: "AI Virtual Assistant",
    description: "Assist businesses remotely using AI tools to manage tasks, emails, and schedules.",
    icon: "bot",
    color: "#0EA5E9",
    emoji: "🤖",
    skills: ["Task Management", "Email Handling", "Scheduling", "Research"],
  },
  {
    id: "ai-customer-support",
    title: "AI Customer Support Agent",
    description: "Provide exceptional customer service powered by AI automation and smart responses.",
    icon: "headphones",
    color: "#22C55E",
    emoji: "🎧",
    skills: ["CRM Tools", "AI Chatbots", "Problem Solving", "Communication"],
  },
  {
    id: "ai-research-assistant",
    title: "AI Research Assistant",
    description: "Conduct deep research and analysis using AI tools for businesses and academics.",
    icon: "search",
    color: "#F59E0B",
    emoji: "🔍",
    skills: ["Data Analysis", "Research Methods", "Report Writing", "AI Research Tools"],
  },
  {
    id: "ai-social-media-manager",
    title: "AI Social Media Manager",
    description: "Grow and manage social media presence using AI-powered content and analytics.",
    icon: "share-2",
    color: "#EC4899",
    emoji: "📱",
    skills: ["Content Creation", "Analytics", "Scheduling", "Community Management"],
  },
  {
    id: "prompt-engineer",
    title: "Prompt Engineer",
    description: "Design and optimize AI prompts to get the best results from large language models.",
    icon: "code-2",
    color: "#EF4444",
    emoji: "⚡",
    skills: ["Prompt Design", "LLM Understanding", "Testing", "Optimization"],
  },
  {
    id: "data-entry-specialist",
    title: "Data Entry Specialist",
    description: "Handle data processing and entry tasks efficiently using AI tools and automation.",
    icon: "database",
    color: "#14B8A6",
    emoji: "📊",
    skills: ["Data Processing", "Spreadsheets", "Accuracy", "AI Automation"],
  },
];
