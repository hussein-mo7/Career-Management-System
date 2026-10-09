import type { Skill } from "@/types";

export const DEFAULT_VISION =
  "Senior Full-Stack Developer, potentially progressing toward Tech Lead, with strong technical, product, communication, and leadership abilities. The aim is real feature ownership across frontend and backend, sound architecture, and the ability to help a team ship production software for real users.";

export const DEFAULT_LONG_TERM = "Senior Full-Stack Developer → Potential Tech Lead";

export const DEFAULT_SKILLS: Skill[] = [
  ["technical", "Frontend"],
  ["technical", "Backend"],
  ["technical", "Database"],
  ["technical", "APIs"],
  ["technical", "Architecture"],
  ["technical", "Testing"],
  ["technical", "DevOps"],
  ["technical", "System design"],
  ["technical", "Security"],
  ["technical", "Performance"],
  ["product", "Product thinking"],
  ["product", "Business understanding"],
  ["product", "Requirements"],
  ["product", "User understanding"],
  ["communication", "English"],
  ["communication", "Storytelling"],
  ["communication", "Active listening"],
  ["communication", "Asking questions"],
  ["communication", "Technical communication"],
  ["leadership", "Ownership"],
  ["leadership", "Mentoring"],
  ["leadership", "Code reviews"],
  ["leadership", "Team leadership"],
  ["leadership", "Decision making"],
].map(([group, name]) => ({
  group: group as Skill["group"],
  name,
  status: "not_started" as const,
}));

export const DEFAULT_CRITERIA: {
  criterion: string;
  category:
    | "work_environment"
    | "team"
    | "technical"
    | "product"
    | "growth"
    | "communication"
    | "location"
    | "leadership"
    | "culture";
  priority: "must_have" | "high" | "nice" | "explore";
  notes?: string;
}[] = [
  { criterion: "Remote compatibility", category: "location", priority: "must_have" },
  { criterion: "Real product and projects", category: "product", priority: "must_have" },
  { criterion: "Real users and business problems", category: "product", priority: "must_have" },
  { criterion: "Opportunity for full-stack development", category: "technical", priority: "must_have" },
  { criterion: "Experienced developers or a senior engineer", category: "team", priority: "must_have" },
  { criterion: "Code reviews", category: "technical", priority: "must_have" },
  { criterion: "Learning opportunity", category: "growth", priority: "must_have" },
  { criterion: "Strong communication", category: "communication", priority: "must_have" },
  { criterion: "Small or medium engineering team", category: "team", priority: "high", notes: "About 5–10 developers is attractive." },
  { criterion: "Feature ownership", category: "growth", priority: "high" },
  { criterion: "Mentorship", category: "growth", priority: "high" },
  { criterion: "Technical leadership", category: "leadership", priority: "high" },
  { criterion: "Architecture exposure", category: "technical", priority: "high" },
  { criterion: "Frontend and backend work", category: "technical", priority: "high" },
  { criterion: "Product and business exposure", category: "product", priority: "high" },
  { criterion: "Career progression", category: "growth", priority: "high" },
  { criterion: "Modern technologies", category: "technical", priority: "nice" },
  { criterion: "Fast-growing company", category: "culture", priority: "nice" },
  { criterion: "Leadership opportunities", category: "leadership", priority: "nice" },
  { criterion: "International team", category: "team", priority: "nice" },
  { criterion: "Flexible hours", category: "work_environment", priority: "nice" },
  { criterion: "Healthy work environment", category: "culture", priority: "high" },
  { criterion: "Industry specialization", category: "product", priority: "explore", notes: "AI, fintech, healthtech, edtech, cybersecurity, SaaS, e-commerce, developer tools, logistics, PropTech." },
];

export const DEFAULT_PROFILE = {
  title: "Full-Stack Developer",
  currentGoal:
    "Build strong production experience and progress toward Senior Full-Stack Developer / Tech Lead.",
  careerStatement:
    "Full-stack developer focused on real products, clear communication, and steady growth toward senior ownership.",
  targetRegions: ["Gulf", "Palestine", "Jordan"],
  preferredRoles: ["Full-Stack Developer", "Frontend Developer", "Backend Developer"],
  preferredCompanySize: "Small or medium engineering team",
  preferredWorkEnvironment:
    "Product-oriented startup or mid-size company with real users, senior engineers, code reviews, and mentorship.",
  remotePreference: "remote_friendly" as const,
  searchFocus: "Early-career software roles with production ownership and room to learn.",
};
