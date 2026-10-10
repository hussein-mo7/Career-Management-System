import { z } from "zod";
import {
  ACTION_STATUSES,
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

const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) => text(max).optional().default("");
const dateField = z
  .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")])
  .optional()
  .default("");

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

const optionalId = z.union([z.literal(""), objectIdSchema]).optional().default("");

const rating = z
  .union([z.null(), z.literal(""), z.coerce.number().int().min(1).max(5)])
  .optional()
  .transform((value) => (value ? value : null));

const urlField = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), "Enter a valid http(s) URL")
  .optional()
  .default("");

export const setupSchema = z.object({
  name: text(80).min(2, "Name is required"),
  email: z.string().trim().email("Enter a valid email").max(160),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required").max(200),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(200),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const profileSchema = z.object({
  name: text(80).min(2, "Name is required"),
  title: optionalText(120),
  currentGoal: optionalText(500),
  location: optionalText(120),
  targetRegions: z.array(text(80)).max(12).optional().default([]),
  careerStatement: optionalText(1000),
});

export const skillSchema = z.object({
  name: text(80).min(1, "Skill name is required"),
  group: z.enum(SKILL_GROUPS),
  status: z.enum(SKILL_STATUSES),
});

export const careerSchema = z.object({
  vision: optionalText(8000),
  longTermTarget: optionalText(240),
  currentTargetRole: optionalText(160),
  preferredRoles: z.array(text(80)).max(12).optional().default([]),
  preferredCompanySize: optionalText(160),
  preferredWorkEnvironment: optionalText(500),
  preferredRegions: z.array(text(80)).max(12).optional().default([]),
  remotePreference: z.enum(REMOTE_PREFERENCES),
  searchFocus: optionalText(500),
  skills: z.array(skillSchema).max(40),
});

export const skillStatusSchema = z.object({
  name: text(80).min(1),
  group: z.enum(SKILL_GROUPS),
  status: z.enum(SKILL_STATUSES),
});

export const criterionSchema = z.object({
  criterion: text(200).min(2, "Criterion is required"),
  category: z.enum(CRITERION_CATEGORIES),
  priority: z.enum(CRITERION_PRIORITIES),
  notes: optionalText(2000),
});

export const reorderSchema = z.object({
  priority: z.enum(CRITERION_PRIORITIES),
  ids: z.array(objectIdSchema).min(1),
});

export const companySchema = z.object({
  name: text(160).min(2, "Company name is required"),
  website: urlField,
  location: optionalText(160),
  country: optionalText(80),
  industry: optionalText(80),
  types: z.array(z.enum(COMPANY_TYPES)).max(6).optional().default([]),
  size: optionalText(80),
  remoteModel: z.enum(REMOTE_MODELS).optional().default("unknown"),
  description: optionalText(4000),
  whyInterests: optionalText(4000),
  whyFits: optionalText(4000),
  concerns: optionalText(4000),
  notes: optionalText(4000),
  nextAction: optionalText(240),
  nextActionDate: dateField,
  status: z.enum(COMPANY_STATUSES).optional().default("discovered"),
  fitRating: rating,
});

export const evaluationSchema = z.object({
  evaluations: z
    .array(
      z.object({
        criterionId: objectIdSchema,
        status: z.enum(CRITERIA_EVALUATIONS),
      }),
    )
    .max(80),
});

const reflectionSchema = z.object({
  introClear: z.boolean().optional().default(false),
  journeyNatural: z.boolean().optional().default(false),
  toldStory: z.boolean().optional().default(false),
  letThemTalk: z.boolean().optional().default(false),
  genuineInterest: z.boolean().optional().default(false),
  followUpQuestions: z.boolean().optional().default(false),
  feltNatural: z.boolean().optional().default(false),
  comfortableAtmosphere: z.boolean().optional().default(false),
  usefulQuestions: z.boolean().optional().default(false),
});

export const personSchema = z.object({
  name: text(120).min(2, "Name is required"),
  role: optionalText(120),
  companyName: optionalText(160),
  companyId: optionalId,
  linkedin: urlField,
  howWeMet: optionalText(500),
  relationshipType: z.enum(RELATIONSHIP_TYPES).optional().default("other"),
  notes: optionalText(4000),
});

export const interactionSchema = z.object({
  personId: objectIdSchema,
  date: dateField,
  type: z.enum(INTERACTION_TYPES).optional().default("coffee_chat"),
  notes: optionalText(4000),
  learned: optionalText(2000),
  improve: optionalText(2000),
  nextStep: optionalText(500),
  rating,
  reflection: reflectionSchema.optional(),
  createAction: z.boolean().optional().default(false),
});

export const applicationSchema = z
  .object({
    companyName: optionalText(160),
    companyId: optionalId,
    role: text(160).min(2, "Role is required"),
    jobUrl: urlField,
    dateApplied: dateField,
    status: z.enum(APPLICATION_STATUSES).optional().default("saved"),
    cvVersion: optionalText(80),
    coverLetterNotes: optionalText(4000),
    contactId: optionalId,
    notes: optionalText(4000),
    nextAction: optionalText(240),
    followUpDate: dateField,
  })
  .superRefine((data, ctx) => {
    const name = (data.companyName || "").trim();
    if (!data.companyId && !name) {
      ctx.addIssue({ code: "custom", message: "Company is required", path: ["companyName"] });
    }
  });

export const actionSchema = z.object({
  title: text(240).min(2, "Action is required"),
  companyName: optionalText(160),
  companyId: optionalId,
  personId: optionalId,
  applicationId: optionalId,
  dueDate: dateField,
  status: z.enum(ACTION_STATUSES).optional().default("pending"),
});

export const interviewSchema = z
  .object({
    companyName: optionalText(160),
    companyId: optionalId,
    applicationId: optionalId,
    role: text(160).min(2, "Role is required"),
    date: dateField,
    type: z.enum(INTERVIEW_TYPES).optional().default("technical"),
    interviewer: optionalText(120),
    result: z.enum(INTERVIEW_RESULTS).optional().default("pending"),
    notes: optionalText(4000),
    wentWell: optionalText(2000),
    wentWrong: optionalText(2000),
    lessons: optionalText(2000),
    nextSteps: optionalText(2000),
  })
  .superRefine((data, ctx) => {
    const name = (data.companyName || "").trim();
    if (!data.companyId && !name) {
      ctx.addIssue({ code: "custom", message: "Company is required", path: ["companyName"] });
    }
  });

export const questionSchema = z.object({
  interviewId: objectIdSchema,
  question: text(500).min(2, "Question is required"),
  category: z.enum(QUESTION_CATEGORIES).optional().default("general"),
  answerNotes: optionalText(4000),
  performance: optionalText(2000),
  improvement: optionalText(2000),
  learningStatus: z.enum(LEARNING_STATUSES).optional().default("need_to_learn"),
  relatedTopic: optionalText(160),
});

export const questionStatusSchema = z.object({
  learningStatus: z.enum(LEARNING_STATUSES),
});

export const learningItemSchema = z.object({
  title: text(240).min(2, "Title is required"),
  category: z.enum(LEARNING_CATEGORIES).optional().default("general"),
  status: z.enum(LEARNING_STATUSES).optional().default("need_to_learn"),
  notes: optionalText(4000),
  topic: optionalText(160),
  sourceQuestionId: optionalId,
});

export const noteSchema = z.object({
  title: text(160).min(2, "Title is required"),
  content: optionalText(20000),
  category: z.enum(NOTE_CATEGORIES).optional().default("general"),
  tags: z.array(text(40)).max(12).optional().default([]),
});

export const weeklySchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid week"),
  wins: optionalText(4000),
  lessons: optionalText(4000),
  focus: optionalText(4000),
});

export type CompanyInput = z.infer<typeof companySchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type CareerInput = z.infer<typeof careerSchema>;
export type PersonInput = z.infer<typeof personSchema>;
export type InteractionInput = z.infer<typeof interactionSchema>;
export type ActionInput = z.infer<typeof actionSchema>;
export type InterviewInput = z.infer<typeof interviewSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type LearningItemInput = z.infer<typeof learningItemSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type CriterionInput = z.infer<typeof criterionSchema>;
