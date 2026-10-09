export const COMPANY_STATUSES = [
  "discovered",
  "researching",
  "qualified",
  "networking",
  "applied",
  "interview",
  "offer",
  "closed",
] as const;

export const COMPANY_TYPES = [
  "startup",
  "mid_size",
  "large",
  "agency",
  "product_company",
  "other",
] as const;

export const REMOTE_MODELS = [
  "remote_first",
  "remote_friendly",
  "hybrid",
  "on_site",
  "unknown",
] as const;

export const CRITERION_CATEGORIES = [
  "work_environment",
  "team",
  "technical",
  "product",
  "growth",
  "communication",
  "compensation",
  "location",
  "leadership",
  "culture",
] as const;

export const CRITERION_PRIORITIES = ["must_have", "high", "nice", "explore"] as const;

export const CRITERIA_EVALUATIONS = ["good", "neutral", "concern", "unknown"] as const;

export const RELATIONSHIP_TYPES = [
  "recruiter",
  "developer",
  "senior_developer",
  "tech_lead",
  "engineering_manager",
  "cto",
  "founder",
  "product_manager",
  "designer",
  "mentor",
  "tap_contact",
  "other",
] as const;

export const INTERACTION_TYPES = [
  "coffee_chat",
  "mentoring",
  "career_coaching",
  "networking",
  "tap",
  "interview_related",
  "other",
] as const;

export const APPLICATION_STATUSES = [
  "saved",
  "applied",
  "screening",
  "technical_interview",
  "final_interview",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export const ACTION_STATUSES = ["pending", "done"] as const;

export const INTERVIEW_TYPES = [
  "hr",
  "recruiter",
  "technical",
  "behavioral",
  "system_design",
  "coding",
  "final",
  "other",
] as const;

export const INTERVIEW_RESULTS = ["pending", "passed", "rejected", "offer", "withdrawn"] as const;

export const QUESTION_CATEGORIES = [
  "hr",
  "behavioral",
  "frontend",
  "backend",
  "database",
  "javascript",
  "typescript",
  "react",
  "nextjs",
  "nodejs",
  "api",
  "authentication",
  "security",
  "system_design",
  "devops",
  "testing",
  "architecture",
  "general",
] as const;

export const LEARNING_CATEGORIES = [...QUESTION_CATEGORIES, "communication", "career"] as const;

export const LEARNING_STATUSES = [
  "need_to_learn",
  "practicing",
  "comfortable",
  "mastered",
] as const;

export const SKILL_GROUPS = ["technical", "product", "communication", "leadership"] as const;

export const SKILL_STATUSES = [
  "not_started",
  "learning",
  "practicing",
  "comfortable",
  "strong",
] as const;

export const NOTE_CATEGORIES = [
  "career",
  "job_search",
  "interview",
  "networking",
  "technical",
  "communication",
  "ideas",
  "general",
] as const;

export const REMOTE_PREFERENCES = [
  "remote_first",
  "remote_friendly",
  "hybrid",
  "on_site",
  "flexible",
  "unknown",
] as const;

export const COMPANY_STATUS_LABELS: Record<(typeof COMPANY_STATUSES)[number], string> = {
  discovered: "Discovered",
  researching: "Researching",
  qualified: "Qualified",
  networking: "Networking",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  closed: "Closed",
};

export const COMPANY_TYPE_LABELS: Record<(typeof COMPANY_TYPES)[number], string> = {
  startup: "Startup",
  mid_size: "Mid-size",
  large: "Large",
  agency: "Agency",
  product_company: "Product company",
  other: "Other",
};

export const REMOTE_LABELS: Record<string, string> = {
  remote_first: "Remote-first",
  remote_friendly: "Remote-friendly",
  hybrid: "Hybrid",
  on_site: "On-site",
  unknown: "Unknown",
  flexible: "Flexible",
};

export const PRIORITY_LABELS: Record<(typeof CRITERION_PRIORITIES)[number], string> = {
  must_have: "Must have",
  high: "High priority",
  nice: "Nice to have",
  explore: "Explore",
};

export const CATEGORY_LABELS: Record<string, string> = {
  work_environment: "Work environment",
  team: "Team",
  technical: "Technical",
  product: "Product",
  growth: "Growth",
  communication: "Communication",
  compensation: "Compensation",
  location: "Location",
  leadership: "Leadership",
  culture: "Culture",
  hr: "HR",
  behavioral: "Behavioral",
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
  javascript: "JavaScript",
  typescript: "TypeScript",
  react: "React",
  nextjs: "Next.js",
  nodejs: "Node.js",
  api: "API",
  authentication: "Authentication",
  security: "Security",
  system_design: "System design",
  devops: "DevOps",
  testing: "Testing",
  architecture: "Architecture",
  general: "General",
  career: "Career",
  job_search: "Job search",
  interview: "Interview",
  networking: "Networking",
  ideas: "Ideas",
};

export const RELATIONSHIP_LABELS: Record<(typeof RELATIONSHIP_TYPES)[number], string> = {
  recruiter: "Recruiter",
  developer: "Developer",
  senior_developer: "Senior developer",
  tech_lead: "Tech lead",
  engineering_manager: "Engineering manager",
  cto: "CTO",
  founder: "Founder",
  product_manager: "Product manager",
  designer: "Designer",
  mentor: "Mentor",
  tap_contact: "TAP contact",
  other: "Other",
};

export const INTERACTION_LABELS: Record<(typeof INTERACTION_TYPES)[number], string> = {
  coffee_chat: "Coffee chat",
  mentoring: "Mentoring",
  career_coaching: "Career coaching",
  networking: "Networking",
  tap: "TAP",
  interview_related: "Interview-related",
  other: "Other",
};

export const APPLICATION_STATUS_LABELS: Record<(typeof APPLICATION_STATUSES)[number], string> = {
  saved: "Saved",
  applied: "Applied",
  screening: "Screening",
  technical_interview: "Technical interview",
  final_interview: "Final interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const INTERVIEW_TYPE_LABELS: Record<(typeof INTERVIEW_TYPES)[number], string> = {
  hr: "HR",
  recruiter: "Recruiter",
  technical: "Technical",
  behavioral: "Behavioral",
  system_design: "System design",
  coding: "Coding",
  final: "Final",
  other: "Other",
};

export const INTERVIEW_RESULT_LABELS: Record<(typeof INTERVIEW_RESULTS)[number], string> = {
  pending: "Pending",
  passed: "Passed",
  rejected: "Rejected",
  offer: "Offer",
  withdrawn: "Withdrawn",
};

export const LEARNING_STATUS_LABELS: Record<(typeof LEARNING_STATUSES)[number], string> = {
  need_to_learn: "Need to learn",
  practicing: "Practicing",
  comfortable: "Comfortable",
  mastered: "Mastered",
};

export const SKILL_GROUP_LABELS: Record<(typeof SKILL_GROUPS)[number], string> = {
  technical: "Technical",
  product: "Product",
  communication: "Communication",
  leadership: "Leadership",
};

export const SKILL_STATUS_LABELS: Record<(typeof SKILL_STATUSES)[number], string> = {
  not_started: "Not started",
  learning: "Learning",
  practicing: "Practicing",
  comfortable: "Comfortable",
  strong: "Strong",
};

export const NOTE_CATEGORY_LABELS: Record<(typeof NOTE_CATEGORIES)[number], string> = {
  career: "Career",
  job_search: "Job search",
  interview: "Interview",
  networking: "Networking",
  technical: "Technical",
  communication: "Communication",
  ideas: "Ideas",
  general: "General",
};

export const EVALUATION_LABELS: Record<(typeof CRITERIA_EVALUATIONS)[number], string> = {
  good: "Good",
  neutral: "Neutral",
  concern: "Concern",
  unknown: "Unknown",
};

export const FIT_LABELS: Record<number, string> = {
  1: "Poor fit",
  2: "Weak",
  3: "Possible",
  4: "Strong",
  5: "Excellent",
};

export const REFLECTION_FIELDS = [
  { key: "introClear", group: "Storytelling", label: "My introduction was clear" },
  { key: "journeyNatural", group: "Storytelling", label: "I explained my journey naturally" },
  { key: "toldStory", group: "Storytelling", label: "I told a story instead of listing facts" },
  { key: "letThemTalk", group: "Listening", label: "I let the other person talk" },
  { key: "genuineInterest", group: "Listening", label: "I showed genuine interest" },
  { key: "followUpQuestions", group: "Listening", label: "I asked follow-up questions" },
  { key: "feltNatural", group: "Conversation", label: "The conversation felt natural" },
  { key: "comfortableAtmosphere", group: "Conversation", label: "I created a comfortable atmosphere" },
  { key: "usefulQuestions", group: "Conversation", label: "I asked useful questions" },
] as const;

export const REGION_SUGGESTIONS = ["Gulf", "Palestine", "Jordan", "Europe / EU"];

export function labelOf(map: Record<string, string>, value?: string | null) {
  if (!value) return "—";
  return map[value] ?? value;
}
