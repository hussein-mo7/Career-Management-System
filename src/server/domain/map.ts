import { Types } from "mongoose";
import type {
  Application,
  CareerAction,
  CareerProfile,
  Company,
  Criterion,
  Interaction,
  Interview,
  InterviewQuestion,
  LearningItem,
  Note,
  Person,
  Reflection,
  UserProfile,
  WeeklyProgress,
} from "@/types";

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function flag(value: unknown) {
  return value === true;
}

function numberOrNull(value: unknown) {
  return typeof value === "number" ? value : null;
}

export function iso(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function requiredIso(value: unknown) {
  return iso(value) ?? new Date(0).toISOString();
}

export function refOf(value: unknown, nameKey: "name" | "role" = "name") {
  if (!value) return null;
  if (value instanceof Types.ObjectId) return { id: value.toString(), name: "" };
  if (typeof value === "string") return { id: value, name: "" };
  if (typeof value === "object" && "_id" in value) {
    const record = value as Record<string, unknown>;
    const preferred = text(record[nameKey]) || text(record.name);
    return { id: String(record._id), name: preferred };
  }
  return null;
}

function reflectionOf(value: unknown): Reflection {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    introClear: flag(record.introClear),
    journeyNatural: flag(record.journeyNatural),
    toldStory: flag(record.toldStory),
    letThemTalk: flag(record.letThemTalk),
    genuineInterest: flag(record.genuineInterest),
    followUpQuestions: flag(record.followUpQuestions),
    feltNatural: flag(record.feltNatural),
    comfortableAtmosphere: flag(record.comfortableAtmosphere),
    usefulQuestions: flag(record.usefulQuestions),
  };
}

export function mapUser(doc: Record<string, unknown>): UserProfile {
  return {
    id: String(doc._id),
    email: text(doc.email),
    name: text(doc.name),
    title: text(doc.title),
    currentGoal: text(doc.currentGoal),
    location: text(doc.location),
    targetRegions: Array.isArray(doc.targetRegions) ? doc.targetRegions.map(String) : [],
    careerStatement: text(doc.careerStatement),
    createdAt: requiredIso(doc.createdAt),
    updatedAt: requiredIso(doc.updatedAt),
  };
}

export function mapCareer(doc: Record<string, unknown>): CareerProfile {
  const skills = Array.isArray(doc.skills) ? doc.skills : [];
  return {
    id: String(doc._id),
    vision: text(doc.vision),
    longTermTarget: text(doc.longTermTarget),
    currentTargetRole: text(doc.currentTargetRole),
    preferredRoles: Array.isArray(doc.preferredRoles) ? doc.preferredRoles.map(String) : [],
    preferredCompanySize: text(doc.preferredCompanySize),
    preferredWorkEnvironment: text(doc.preferredWorkEnvironment),
    preferredRegions: Array.isArray(doc.preferredRegions) ? doc.preferredRegions.map(String) : [],
    remotePreference: (text(doc.remotePreference) || "remote_friendly") as CareerProfile["remotePreference"],
    searchFocus: text(doc.searchFocus),
    skills: skills.map((skill) => {
      const item = skill as Record<string, unknown>;
      return {
        name: text(item.name),
        group: text(item.group) as CareerProfile["skills"][number]["group"],
        status: text(item.status) as CareerProfile["skills"][number]["status"],
      };
    }),
    updatedAt: requiredIso(doc.updatedAt),
  };
}

export function mapCriterion(doc: Record<string, unknown>): Criterion {
  return {
    id: String(doc._id),
    criterion: text(doc.criterion),
    category: text(doc.category) as Criterion["category"],
    priority: text(doc.priority) as Criterion["priority"],
    notes: text(doc.notes),
    order: typeof doc.order === "number" ? doc.order : 0,
  };
}

export function mapCompany(doc: Record<string, unknown>): Company {
  const evaluations = Array.isArray(doc.criteriaEvaluations) ? doc.criteriaEvaluations : [];
  return {
    id: String(doc._id),
    name: text(doc.name),
    website: text(doc.website),
    location: text(doc.location),
    country: text(doc.country),
    industry: text(doc.industry),
    types: Array.isArray(doc.types) ? (doc.types.map(String) as Company["types"]) : [],
    size: text(doc.size),
    remoteModel: (text(doc.remoteModel) || "unknown") as Company["remoteModel"],
    description: text(doc.description),
    whyInterests: text(doc.whyInterests),
    whyFits: text(doc.whyFits),
    concerns: text(doc.concerns),
    notes: text(doc.notes),
    nextAction: text(doc.nextAction),
    nextActionDate: iso(doc.nextActionDate),
    status: (text(doc.status) || "discovered") as Company["status"],
    fitRating: numberOrNull(doc.fitRating),
    criteriaEvaluations: evaluations.flatMap((item) => {
      const entry = item as Record<string, unknown>;
      if (!entry.criterionId || typeof entry.status !== "string") return [];
      return [{ criterionId: String(entry.criterionId), status: entry.status as Company["criteriaEvaluations"][number]["status"] }];
    }),
    isDemo: flag(doc.isDemo),
    createdAt: requiredIso(doc.createdAt),
    updatedAt: requiredIso(doc.updatedAt),
  };
}

export function mapPerson(doc: Record<string, unknown>): Person {
  const company = refOf(doc.companyId);
  return {
    id: String(doc._id),
    name: text(doc.name),
    role: text(doc.role),
    company: company && company.name ? company : company?.id ? company : null,
    linkedin: text(doc.linkedin),
    howWeMet: text(doc.howWeMet),
    relationshipType: (text(doc.relationshipType) || "other") as Person["relationshipType"],
    notes: text(doc.notes),
    isDemo: flag(doc.isDemo),
    createdAt: requiredIso(doc.createdAt),
    updatedAt: requiredIso(doc.updatedAt),
  };
}

export function mapInteraction(doc: Record<string, unknown>): Interaction {
  return {
    id: String(doc._id),
    personId: String(doc.personId && typeof doc.personId === "object" && "_id" in doc.personId ? (doc.personId as { _id: unknown })._id : doc.personId),
    date: iso(doc.date),
    type: (text(doc.type) || "coffee_chat") as Interaction["type"],
    notes: text(doc.notes),
    learned: text(doc.learned),
    improve: text(doc.improve),
    nextStep: text(doc.nextStep),
    rating: numberOrNull(doc.rating),
    reflection: reflectionOf(doc.reflection),
    isDemo: flag(doc.isDemo),
    createdAt: requiredIso(doc.createdAt),
    updatedAt: requiredIso(doc.updatedAt),
  };
}

export function mapApplication(doc: Record<string, unknown>): Application {
  return {
    id: String(doc._id),
    company: refOf(doc.companyId),
    role: text(doc.role),
    jobUrl: text(doc.jobUrl),
    dateApplied: iso(doc.dateApplied),
    status: (text(doc.status) || "saved") as Application["status"],
    cvVersion: text(doc.cvVersion),
    coverLetterNotes: text(doc.coverLetterNotes),
    contact: refOf(doc.contactId),
    notes: text(doc.notes),
    nextAction: text(doc.nextAction),
    followUpDate: iso(doc.followUpDate),
    isDemo: flag(doc.isDemo),
    createdAt: requiredIso(doc.createdAt),
    updatedAt: requiredIso(doc.updatedAt),
  };
}

export function mapAction(doc: Record<string, unknown>): CareerAction {
  const application = refOf(doc.applicationId, "role");
  return {
    id: String(doc._id),
    title: text(doc.title),
    company: refOf(doc.companyId),
    person: refOf(doc.personId),
    application: application ? { id: application.id, role: application.name } : null,
    dueDate: iso(doc.dueDate),
    status: text(doc.status) === "done" ? "done" : "pending",
    isDemo: flag(doc.isDemo),
    createdAt: requiredIso(doc.createdAt),
    updatedAt: requiredIso(doc.updatedAt),
  };
}

export function mapInterview(doc: Record<string, unknown>): Interview {
  const application = refOf(doc.applicationId, "role");
  return {
    id: String(doc._id),
    company: refOf(doc.companyId),
    application: application ? { id: application.id, role: application.name } : null,
    role: text(doc.role),
    date: iso(doc.date),
    type: (text(doc.type) || "technical") as Interview["type"],
    interviewer: text(doc.interviewer),
    result: (text(doc.result) || "pending") as Interview["result"],
    notes: text(doc.notes),
    wentWell: text(doc.wentWell),
    wentWrong: text(doc.wentWrong),
    lessons: text(doc.lessons),
    nextSteps: text(doc.nextSteps),
    isDemo: flag(doc.isDemo),
    createdAt: requiredIso(doc.createdAt),
    updatedAt: requiredIso(doc.updatedAt),
  };
}

export function mapQuestion(doc: Record<string, unknown>): InterviewQuestion {
  const interview = doc.interviewId;
  let summary: InterviewQuestion["interview"] = null;
  if (interview && typeof interview === "object" && "_id" in interview) {
    const record = interview as Record<string, unknown>;
    const company = refOf(record.companyId);
    summary = {
      id: String(record._id),
      role: text(record.role),
      companyName: company?.name || "",
    };
  }
  return {
    id: String(doc._id),
    interviewId: summary?.id || String(doc.interviewId),
    interview: summary,
    question: text(doc.question),
    category: (text(doc.category) || "general") as InterviewQuestion["category"],
    answerNotes: text(doc.answerNotes),
    performance: text(doc.performance),
    improvement: text(doc.improvement),
    learningStatus: (text(doc.learningStatus) || "need_to_learn") as InterviewQuestion["learningStatus"],
    relatedTopic: text(doc.relatedTopic),
    isDemo: flag(doc.isDemo),
    createdAt: requiredIso(doc.createdAt),
    updatedAt: requiredIso(doc.updatedAt),
  };
}

export function mapLearning(doc: Record<string, unknown>): LearningItem {
  return {
    id: String(doc._id),
    title: text(doc.title),
    category: (text(doc.category) || "general") as LearningItem["category"],
    status: (text(doc.status) || "need_to_learn") as LearningItem["status"],
    notes: text(doc.notes),
    topic: text(doc.topic),
    sourceQuestionId: doc.sourceQuestionId ? String(doc.sourceQuestionId) : null,
    isDemo: flag(doc.isDemo),
    createdAt: requiredIso(doc.createdAt),
    updatedAt: requiredIso(doc.updatedAt),
  };
}

export function mapNote(doc: Record<string, unknown>): Note {
  return {
    id: String(doc._id),
    title: text(doc.title),
    content: text(doc.content),
    category: (text(doc.category) || "general") as Note["category"],
    tags: Array.isArray(doc.tags) ? doc.tags.map(String) : [],
    isDemo: flag(doc.isDemo),
    createdAt: requiredIso(doc.createdAt),
    updatedAt: requiredIso(doc.updatedAt),
  };
}

export function mapWeek(doc: Record<string, unknown>): WeeklyProgress {
  return {
    id: String(doc._id),
    weekStart: iso(doc.weekStart) ?? requiredIso(doc.weekStart),
    wins: text(doc.wins),
    lessons: text(doc.lessons),
    focus: text(doc.focus),
    isDemo: flag(doc.isDemo),
    updatedAt: requiredIso(doc.updatedAt),
  };
}
