import type {
  APPLICATION_STATUSES,
  COMPANY_STATUSES,
  COMPANY_TYPES,
  CRITERIA_EVALUATIONS,
  CRITERION_CATEGORIES,
  CRITERION_PRIORITIES,
  INTERACTION_TYPES,
  INTERVIEW_RESULTS,
  INTERVIEW_TYPES,
  LEARNING_CATEGORIES,
  LEARNING_STATUSES,
  NOTE_CATEGORIES,
  QUESTION_CATEGORIES,
  RELATIONSHIP_TYPES,
  REMOTE_MODELS,
  REMOTE_PREFERENCES,
  SKILL_GROUPS,
  SKILL_STATUSES,
} from "@/lib/constants";

export type CompanyStatus = (typeof COMPANY_STATUSES)[number];
export type CompanyType = (typeof COMPANY_TYPES)[number];
export type RemoteModel = (typeof REMOTE_MODELS)[number];
export type CriterionCategory = (typeof CRITERION_CATEGORIES)[number];
export type CriterionPriority = (typeof CRITERION_PRIORITIES)[number];
export type CriteriaEvaluation = (typeof CRITERIA_EVALUATIONS)[number];
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];
export type InteractionType = (typeof INTERACTION_TYPES)[number];
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type InterviewType = (typeof INTERVIEW_TYPES)[number];
export type InterviewResult = (typeof INTERVIEW_RESULTS)[number];
export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];
export type LearningCategory = (typeof LEARNING_CATEGORIES)[number];
export type LearningStatus = (typeof LEARNING_STATUSES)[number];
export type SkillGroup = (typeof SKILL_GROUPS)[number];
export type SkillStatus = (typeof SKILL_STATUSES)[number];
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];
export type RemotePreference = (typeof REMOTE_PREFERENCES)[number];

export type Page<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  facets?: { countries?: string[] };
};

export type Ref = { id: string; name: string };

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  title: string;
  currentGoal: string;
  location: string;
  targetRegions: string[];
  careerStatement: string;
  createdAt: string;
  updatedAt: string;
};

export type Skill = {
  name: string;
  group: SkillGroup;
  status: SkillStatus;
};

export type CareerProfile = {
  id: string;
  vision: string;
  longTermTarget: string;
  currentTargetRole: string;
  preferredRoles: string[];
  preferredCompanySize: string;
  preferredWorkEnvironment: string;
  preferredRegions: string[];
  remotePreference: RemotePreference;
  searchFocus: string;
  skills: Skill[];
  updatedAt: string;
};

export type Criterion = {
  id: string;
  criterion: string;
  category: CriterionCategory;
  priority: CriterionPriority;
  notes: string;
  order: number;
};

export type CriteriaEvaluationEntry = {
  criterionId: string;
  status: CriteriaEvaluation;
};

export type Company = {
  id: string;
  name: string;
  website: string;
  location: string;
  country: string;
  industry: string;
  types: CompanyType[];
  size: string;
  remoteModel: RemoteModel;
  description: string;
  whyInterests: string;
  whyFits: string;
  concerns: string;
  notes: string;
  nextAction: string;
  nextActionDate: string | null;
  status: CompanyStatus;
  fitRating: number | null;
  criteriaEvaluations: CriteriaEvaluationEntry[];
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Reflection = {
  introClear: boolean;
  journeyNatural: boolean;
  toldStory: boolean;
  letThemTalk: boolean;
  genuineInterest: boolean;
  followUpQuestions: boolean;
  feltNatural: boolean;
  comfortableAtmosphere: boolean;
  usefulQuestions: boolean;
};

export type Person = {
  id: string;
  name: string;
  role: string;
  company: Ref | null;
  linkedin: string;
  howWeMet: string;
  relationshipType: RelationshipType;
  notes: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Interaction = {
  id: string;
  personId: string;
  date: string | null;
  type: InteractionType;
  notes: string;
  learned: string;
  improve: string;
  nextStep: string;
  rating: number | null;
  reflection: Reflection;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Application = {
  id: string;
  company: Ref | null;
  role: string;
  jobUrl: string;
  dateApplied: string | null;
  status: ApplicationStatus;
  cvVersion: string;
  coverLetterNotes: string;
  contact: Ref | null;
  notes: string;
  nextAction: string;
  followUpDate: string | null;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CareerAction = {
  id: string;
  title: string;
  company: Ref | null;
  person: Ref | null;
  application: { id: string; role: string } | null;
  dueDate: string | null;
  status: "pending" | "done";
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Interview = {
  id: string;
  company: Ref | null;
  application: { id: string; role: string } | null;
  role: string;
  date: string | null;
  type: InterviewType;
  interviewer: string;
  result: InterviewResult;
  notes: string;
  wentWell: string;
  wentWrong: string;
  lessons: string;
  nextSteps: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InterviewQuestion = {
  id: string;
  interviewId: string;
  interview: { id: string; role: string; companyName: string } | null;
  question: string;
  category: QuestionCategory;
  answerNotes: string;
  performance: string;
  improvement: string;
  learningStatus: LearningStatus;
  relatedTopic: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LearningItem = {
  id: string;
  title: string;
  category: LearningCategory;
  status: LearningStatus;
  notes: string;
  topic: string;
  sourceQuestionId: string | null;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  tags: string[];
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WeeklyProgress = {
  id: string;
  weekStart: string;
  wins: string;
  lessons: string;
  focus: string;
  isDemo: boolean;
  updatedAt: string;
};

export type ActivityItem = {
  id: string;
  type: string;
  title: string;
  detail: string;
  date: string;
  href: string;
};

export type NextActionItem = {
  id: string;
  source: "action" | "company" | "application";
  title: string;
  dueDate: string | null;
  href: string;
  related: string;
};

export type DashboardInsight = {
  tone: "priority" | "learning" | "networking" | "applications" | "preparation";
  text: string;
};

export type DashboardData = {
  direction: {
    currentTargetRole: string;
    longTermTarget: string;
    searchFocus: string;
  };
  pipeline: {
    targetCompanies: number;
    qualifiedCompanies: number;
    networkingConversations: number;
    applications: number;
    interviews: number;
    offers: number;
  };
  nextActions: NextActionItem[];
  activity: ActivityItem[];
  insights: DashboardInsight[];
  week: {
    weekStart: string;
    applications: number;
    conversations: number;
    interviews: number;
    learningUpdates: number;
    wins: string;
    lessons: string;
    focus: string;
  };
};
