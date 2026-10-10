import mongoose, { Schema, type Types } from "mongoose";
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

type SchemaFactory = new (definition?: object, options?: object) => Schema;

function looseSchema(definition: Record<string, unknown>, options?: Record<string, unknown>) {
  const Factory = Schema as unknown as SchemaFactory;
  return new Factory(definition, options);
}

function userIdField(extra?: { unique?: boolean }) {
  return {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
    ...extra,
  };
}

const userSchema = looseSchema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    title: { type: String, default: "" },
    currentGoal: { type: String, default: "" },
    location: { type: String, default: "" },
    targetRegions: { type: [String], default: [] },
    careerStatement: { type: String, default: "" },
  },
  { timestamps: true },
);

const skillSchema = looseSchema(
  {
    name: { type: String, required: true },
    group: { type: String, enum: SKILL_GROUPS, required: true },
    status: { type: String, enum: SKILL_STATUSES, default: "not_started" },
  },
  { _id: false },
);

const careerSchema = looseSchema(
  {
    userId: userIdField({ unique: true }),
    vision: { type: String, default: "" },
    longTermTarget: { type: String, default: "" },
    currentTargetRole: { type: String, default: "" },
    preferredRoles: { type: [String], default: [] },
    preferredCompanySize: { type: String, default: "" },
    preferredWorkEnvironment: { type: String, default: "" },
    preferredRegions: { type: [String], default: [] },
    remotePreference: { type: String, enum: REMOTE_PREFERENCES, default: "remote_friendly" },
    searchFocus: { type: String, default: "" },
    skills: { type: [skillSchema], default: [] },
  },
  { timestamps: true },
);

const criterionSchema = looseSchema(
  {
    userId: userIdField(),
    criterion: { type: String, required: true, trim: true },
    category: { type: String, enum: CRITERION_CATEGORIES, required: true },
    priority: { type: String, enum: CRITERION_PRIORITIES, required: true },
    notes: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);
criterionSchema.index({ userId: 1, priority: 1, order: 1 });

const companySchema = looseSchema(
  {
    userId: userIdField(),
    name: { type: String, required: true, trim: true },
    website: { type: String, default: "" },
    location: { type: String, default: "" },
    country: { type: String, default: "" },
    industry: { type: String, default: "" },
    types: { type: [String], enum: COMPANY_TYPES, default: [] },
    size: { type: String, default: "" },
    remoteModel: { type: String, enum: REMOTE_MODELS, default: "unknown" },
    description: { type: String, default: "" },
    whyInterests: { type: String, default: "" },
    whyFits: { type: String, default: "" },
    concerns: { type: String, default: "" },
    notes: { type: String, default: "" },
    nextAction: { type: String, default: "" },
    nextActionDate: { type: Date, default: null },
    status: { type: String, enum: COMPANY_STATUSES, default: "discovered", index: true },
    fitRating: { type: Number, min: 1, max: 5, default: null },
    criteriaEvaluations: {
      type: [
        looseSchema(
          {
            criterionId: { type: Schema.Types.ObjectId, ref: "CompanyCriterion" },
            status: { type: String, enum: CRITERIA_EVALUATIONS, required: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);
companySchema.index({ userId: 1, status: 1 });
companySchema.index({ userId: 1, name: 1 });

const personSchema = looseSchema(
  {
    userId: userIdField(),
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "" },
    companyName: { type: String, default: "" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", default: null },
    linkedin: { type: String, default: "" },
    howWeMet: { type: String, default: "" },
    relationshipType: { type: String, enum: RELATIONSHIP_TYPES, default: "other" },
    notes: { type: String, default: "" },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);
personSchema.index({ userId: 1, companyId: 1 });
personSchema.index({ userId: 1, name: 1 });

const reflectionSchema = looseSchema(
  {
    introClear: { type: Boolean, default: false },
    journeyNatural: { type: Boolean, default: false },
    toldStory: { type: Boolean, default: false },
    letThemTalk: { type: Boolean, default: false },
    genuineInterest: { type: Boolean, default: false },
    followUpQuestions: { type: Boolean, default: false },
    feltNatural: { type: Boolean, default: false },
    comfortableAtmosphere: { type: Boolean, default: false },
    usefulQuestions: { type: Boolean, default: false },
  },
  { _id: false },
);

const interactionSchema = looseSchema(
  {
    userId: userIdField(),
    personId: { type: Schema.Types.ObjectId, ref: "Person", required: true, index: true },
    date: { type: Date, default: null },
    type: { type: String, enum: INTERACTION_TYPES, default: "coffee_chat" },
    notes: { type: String, default: "" },
    learned: { type: String, default: "" },
    improve: { type: String, default: "" },
    nextStep: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 5, default: null },
    reflection: { type: reflectionSchema, default: () => ({}) },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

const applicationSchema = looseSchema(
  {
    userId: userIdField(),
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    role: { type: String, required: true, trim: true },
    jobUrl: { type: String, default: "" },
    dateApplied: { type: Date, default: null },
    status: { type: String, enum: APPLICATION_STATUSES, default: "saved", index: true },
    cvVersion: { type: String, default: "" },
    coverLetterNotes: { type: String, default: "" },
    contactId: { type: Schema.Types.ObjectId, ref: "Person", default: null },
    notes: { type: String, default: "" },
    nextAction: { type: String, default: "" },
    followUpDate: { type: Date, default: null },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);
applicationSchema.index({ userId: 1, status: 1 });

const actionSchema = looseSchema(
  {
    userId: userIdField(),
    title: { type: String, required: true, trim: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", default: null },
    personId: { type: Schema.Types.ObjectId, ref: "Person", default: null },
    applicationId: { type: Schema.Types.ObjectId, ref: "Application", default: null },
    dueDate: { type: Date, default: null },
    status: { type: String, enum: ACTION_STATUSES, default: "pending", index: true },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);
actionSchema.index({ userId: 1, status: 1, dueDate: 1 });

const interviewSchema = looseSchema(
  {
    userId: userIdField(),
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: "Application", default: null },
    role: { type: String, required: true, trim: true },
    date: { type: Date, default: null },
    type: { type: String, enum: INTERVIEW_TYPES, default: "technical" },
    interviewer: { type: String, default: "" },
    result: { type: String, enum: INTERVIEW_RESULTS, default: "pending" },
    notes: { type: String, default: "" },
    wentWell: { type: String, default: "" },
    wentWrong: { type: String, default: "" },
    lessons: { type: String, default: "" },
    nextSteps: { type: String, default: "" },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);
interviewSchema.index({ userId: 1, result: 1 });

const questionSchema = looseSchema(
  {
    userId: userIdField(),
    interviewId: { type: Schema.Types.ObjectId, ref: "Interview", required: true, index: true },
    question: { type: String, required: true, trim: true },
    category: { type: String, enum: QUESTION_CATEGORIES, default: "general" },
    answerNotes: { type: String, default: "" },
    performance: { type: String, default: "" },
    improvement: { type: String, default: "" },
    learningStatus: { type: String, enum: LEARNING_STATUSES, default: "need_to_learn", index: true },
    relatedTopic: { type: String, default: "" },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);
questionSchema.index({ userId: 1, learningStatus: 1 });

const learningSchema = looseSchema(
  {
    userId: userIdField(),
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: LEARNING_CATEGORIES, default: "general" },
    status: { type: String, enum: LEARNING_STATUSES, default: "need_to_learn", index: true },
    notes: { type: String, default: "" },
    topic: { type: String, default: "" },
    sourceQuestionId: { type: Schema.Types.ObjectId, ref: "InterviewQuestion", default: null },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);
learningSchema.index({ userId: 1, status: 1 });

const noteSchema = looseSchema(
  {
    userId: userIdField(),
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    category: { type: String, enum: NOTE_CATEGORIES, default: "general" },
    tags: { type: [String], default: [] },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);
noteSchema.index({ userId: 1, category: 1 });

const weeklySchema = looseSchema(
  {
    userId: userIdField(),
    weekStart: { type: Date, required: true },
    wins: { type: String, default: "" },
    lessons: { type: String, default: "" },
    focus: { type: String, default: "" },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);
weeklySchema.index({ userId: 1, weekStart: 1 }, { unique: true });

/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose 9 schema inference exhausts the type checker, so documents stay untyped here. */
export type LooseDoc = Record<string, any>;

export type LooseModel = {
  find: (...args: any[]) => any;
  findOne: (...args: any[]) => any;
  findById: (...args: any[]) => any;
  findByIdAndUpdate: (...args: any[]) => any;
  findOneAndUpdate: (...args: any[]) => any;
  create: (...args: any[]) => any;
  insertMany: (...args: any[]) => any;
  updateOne: (...args: any[]) => any;
  updateMany: (...args: any[]) => any;
  deleteMany: (...args: any[]) => any;
  deleteOne: (...args: any[]) => any;
  countDocuments: (...args: any[]) => any;
  distinct: (...args: any[]) => any;
  exists: (...args: any[]) => any;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

function register(name: string, schema: Schema): LooseModel {
  const existing = mongoose.models[name] as LooseModel | undefined;
  if (existing) return existing;
  const createModel = mongoose.model as unknown as (modelName: string, schema: Schema) => LooseModel;
  return createModel(name, schema);
}

export const User = register("User", userSchema);
export const CareerProfile = register("CareerProfile", careerSchema);
export const CompanyCriterion = register("CompanyCriterion", criterionSchema);
export const Company = register("Company", companySchema);
export const Person = register("Person", personSchema);
export const Interaction = register("Interaction", interactionSchema);
export const Application = register("Application", applicationSchema);
export const CareerAction = register("CareerAction", actionSchema);
export const Interview = register("Interview", interviewSchema);
export const InterviewQuestion = register("InterviewQuestion", questionSchema);
export const LearningItem = register("LearningItem", learningSchema);
export const Note = register("Note", noteSchema);
export const WeeklyProgress = register("WeeklyProgress", weeklySchema);

export type WithId = { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date };
