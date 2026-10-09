import {
  APPLICATION_STATUSES,
  INTERVIEW_RESULTS,
  INTERVIEW_TYPES,
} from "@/lib/constants";
import type { ActionInput, ApplicationInput, InterviewInput, QuestionInput } from "@/schemas";
import { parseDateInput } from "@/server/domain/career";
import { mapAction, mapApplication, mapInterview, mapQuestion } from "@/server/domain/map";
import {
  Application,
  CareerAction,
  Interview,
  InterviewQuestion,
  LearningItem,
  type LooseDoc,
} from "@/server/models";
import {
  assertApplication,
  assertCompany,
  assertInterview,
  assertPerson,
  requireOwned,
} from "@/server/services/access";
import { containsRegex } from "@/server/http";
import type { LearningStatus } from "@/types";

export async function listApplications(
  userId: string,
  query: { page: number; limit: number; skip: number; q: string; url: URL },
) {
  const filter: Record<string, unknown> = { userId };
  const status = query.url.searchParams.get("status");
  const companyId = query.url.searchParams.get("companyId");
  if (status && (APPLICATION_STATUSES as readonly string[]).includes(status)) filter.status = status;
  if (companyId) filter.companyId = companyId;
  const regex = containsRegex(query.q);
  if (regex) filter.role = regex;
  const [items, total] = await Promise.all([
    Application.find(filter)
      .sort({ updatedAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .populate("companyId", "name")
      .populate("contactId", "name")
      .lean(),
    Application.countDocuments(filter),
  ]);
  return {
    items: items.map((item: LooseDoc) => mapApplication(item)),
    page: query.page,
    limit: query.limit,
    total,
  };
}

export async function getApplication(userId: string, id: string) {
  await requireOwned(Application, userId, id, "Application");
  const doc = await Application.findOne({ _id: id, userId })
    .populate("companyId", "name")
    .populate("contactId", "name")
    .lean();
  return doc ? mapApplication(doc) : null;
}

export async function createApplication(userId: string, input: ApplicationInput) {
  await assertCompany(userId, input.companyId, true);
  await assertPerson(userId, input.contactId);
  const doc = await Application.create({
    userId,
    companyId: input.companyId,
    role: input.role,
    jobUrl: input.jobUrl,
    dateApplied: parseDateInput(input.dateApplied),
    status: input.status,
    cvVersion: input.cvVersion,
    coverLetterNotes: input.coverLetterNotes,
    contactId: input.contactId || null,
    notes: input.notes,
    nextAction: input.nextAction,
    followUpDate: parseDateInput(input.followUpDate),
  });
  const populated = await Application.findById(doc._id).populate("companyId", "name").populate("contactId", "name").lean();
  return mapApplication(populated ?? doc.toObject());
}

export async function updateApplication(userId: string, id: string, input: ApplicationInput) {
  const existing = await requireOwned(Application, userId, id, "Application");
  await assertCompany(userId, input.companyId, true);
  await assertPerson(userId, input.contactId);
  existing.set({
    companyId: input.companyId,
    role: input.role,
    jobUrl: input.jobUrl,
    dateApplied: parseDateInput(input.dateApplied),
    status: input.status,
    cvVersion: input.cvVersion,
    coverLetterNotes: input.coverLetterNotes,
    contactId: input.contactId || null,
    notes: input.notes,
    nextAction: input.nextAction,
    followUpDate: parseDateInput(input.followUpDate),
  });
  await existing.save();
  const populated = await Application.findById(existing._id).populate("companyId", "name").populate("contactId", "name").lean();
  return mapApplication(populated ?? existing.toObject());
}

export async function deleteApplication(userId: string, id: string) {
  const existing = await requireOwned(Application, userId, id, "Application");
  await Interview.updateMany({ userId, applicationId: id }, { applicationId: null });
  await CareerAction.deleteMany({ userId, applicationId: id });
  await existing.deleteOne();
  return { deleted: true };
}

export async function listActions(userId: string, url: URL) {
  const filter: Record<string, unknown> = { userId };
  const status = url.searchParams.get("status");
  const companyId = url.searchParams.get("companyId");
  const personId = url.searchParams.get("personId");
  if (status === "pending" || status === "done") filter.status = status;
  if (companyId) filter.companyId = companyId;
  if (personId) filter.personId = personId;
  const items = await CareerAction.find(filter)
    .sort({ status: 1, dueDate: 1, createdAt: -1 })
    .limit(100)
    .populate("companyId", "name")
    .populate("personId", "name")
    .populate("applicationId", "role")
    .lean();
  return items.map((item: LooseDoc) => mapAction(item));
}

export async function createAction(userId: string, input: ActionInput) {
  await assertCompany(userId, input.companyId);
  await assertPerson(userId, input.personId);
  await assertApplication(userId, input.applicationId);
  const doc = await CareerAction.create({
    userId,
    title: input.title,
    companyId: input.companyId || null,
    personId: input.personId || null,
    applicationId: input.applicationId || null,
    dueDate: parseDateInput(input.dueDate),
    status: input.status,
  });
  const populated = await CareerAction.findById(doc._id)
    .populate("companyId", "name")
    .populate("personId", "name")
    .populate("applicationId", "role")
    .lean();
  return mapAction(populated ?? doc.toObject());
}

export async function updateAction(userId: string, id: string, input: ActionInput) {
  const existing = await requireOwned(CareerAction, userId, id, "Action");
  await assertCompany(userId, input.companyId);
  await assertPerson(userId, input.personId);
  await assertApplication(userId, input.applicationId);
  existing.set({
    title: input.title,
    companyId: input.companyId || null,
    personId: input.personId || null,
    applicationId: input.applicationId || null,
    dueDate: parseDateInput(input.dueDate),
    status: input.status,
  });
  await existing.save();
  const populated = await CareerAction.findById(existing._id)
    .populate("companyId", "name")
    .populate("personId", "name")
    .populate("applicationId", "role")
    .lean();
  return mapAction(populated ?? existing.toObject());
}

export async function setActionStatus(userId: string, id: string, status: "pending" | "done") {
  const existing = await requireOwned(CareerAction, userId, id, "Action");
  existing.status = status;
  await existing.save();
  const populated = await CareerAction.findById(existing._id)
    .populate("companyId", "name")
    .populate("personId", "name")
    .populate("applicationId", "role")
    .lean();
  return mapAction(populated ?? existing.toObject());
}

export async function deleteAction(userId: string, id: string) {
  const existing = await requireOwned(CareerAction, userId, id, "Action");
  await existing.deleteOne();
  return { deleted: true };
}

export async function listInterviews(
  userId: string,
  query: { page: number; limit: number; skip: number; q: string; url: URL },
) {
  const filter: Record<string, unknown> = { userId };
  const type = query.url.searchParams.get("type");
  const result = query.url.searchParams.get("result");
  const companyId = query.url.searchParams.get("companyId");
  if (type && (INTERVIEW_TYPES as readonly string[]).includes(type)) filter.type = type;
  if (result && (INTERVIEW_RESULTS as readonly string[]).includes(result)) filter.result = result;
  if (companyId) filter.companyId = companyId;
  const regex = containsRegex(query.q);
  if (regex) filter.role = regex;
  const [items, total] = await Promise.all([
    Interview.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .populate("companyId", "name")
      .populate("applicationId", "role")
      .lean(),
    Interview.countDocuments(filter),
  ]);
  return { items: items.map((item: LooseDoc) => mapInterview(item)), page: query.page, limit: query.limit, total };
}

export async function getInterview(userId: string, id: string) {
  await requireOwned(Interview, userId, id, "Interview");
  const [interview, questions] = await Promise.all([
    Interview.findOne({ _id: id, userId }).populate("companyId", "name").populate("applicationId", "role").lean(),
    InterviewQuestion.find({ userId, interviewId: id }).sort({ createdAt: 1 }).lean(),
  ]);
  if (!interview) return null;
  return {
    interview: mapInterview(interview),
    questions: questions.map((item: LooseDoc) => mapQuestion(item)),
  };
}

export async function createInterview(userId: string, input: InterviewInput) {
  await assertCompany(userId, input.companyId, true);
  if (input.applicationId) {
    const application = await assertApplication(userId, input.applicationId);
    if (application && String(application.companyId) !== input.companyId) {
      const { ApiError } = await import("@/lib/errors");
      throw new ApiError("That application belongs to a different company", 422);
    }
  }
  const doc = await Interview.create({
    userId,
    companyId: input.companyId,
    applicationId: input.applicationId || null,
    role: input.role,
    date: parseDateInput(input.date),
    type: input.type,
    interviewer: input.interviewer,
    result: input.result,
    notes: input.notes,
    wentWell: input.wentWell,
    wentWrong: input.wentWrong,
    lessons: input.lessons,
    nextSteps: input.nextSteps,
  });
  const populated = await Interview.findById(doc._id).populate("companyId", "name").populate("applicationId", "role").lean();
  return mapInterview(populated ?? doc.toObject());
}

export async function updateInterview(userId: string, id: string, input: InterviewInput) {
  const existing = await requireOwned(Interview, userId, id, "Interview");
  await assertCompany(userId, input.companyId, true);
  await assertApplication(userId, input.applicationId);
  existing.set({
    companyId: input.companyId,
    applicationId: input.applicationId || null,
    role: input.role,
    date: parseDateInput(input.date),
    type: input.type,
    interviewer: input.interviewer,
    result: input.result,
    notes: input.notes,
    wentWell: input.wentWell,
    wentWrong: input.wentWrong,
    lessons: input.lessons,
    nextSteps: input.nextSteps,
  });
  await existing.save();
  const populated = await Interview.findById(existing._id).populate("companyId", "name").populate("applicationId", "role").lean();
  return mapInterview(populated ?? existing.toObject());
}

export async function deleteInterview(userId: string, id: string) {
  const existing = await requireOwned(Interview, userId, id, "Interview");
  const questions = await InterviewQuestion.find({ userId, interviewId: id }).select("_id");
  const ids = questions.map((item: LooseDoc) => item._id);
  await LearningItem.updateMany({ userId, sourceQuestionId: { $in: ids } }, { sourceQuestionId: null });
  await InterviewQuestion.deleteMany({ userId, interviewId: id });
  await existing.deleteOne();
  return { deleted: true };
}

async function syncQuestion(userId: string, questionId: string, status: LearningStatus) {
  await LearningItem.updateMany({ userId, sourceQuestionId: questionId }, { status });
}

export async function createQuestion(userId: string, input: QuestionInput) {
  await assertInterview(userId, input.interviewId, true);
  const doc = await InterviewQuestion.create({ ...input, userId });
  await syncQuestion(userId, String(doc._id), input.learningStatus);
  return mapQuestion(doc.toObject());
}

export async function updateQuestion(userId: string, id: string, input: QuestionInput) {
  const existing = await requireOwned(InterviewQuestion, userId, id, "Question");
  await assertInterview(userId, input.interviewId, true);
  existing.set(input);
  await existing.save();
  await syncQuestion(userId, id, input.learningStatus);
  return mapQuestion(existing.toObject());
}

export async function updateQuestionStatus(userId: string, id: string, learningStatus: LearningStatus) {
  const existing = await requireOwned(InterviewQuestion, userId, id, "Question");
  existing.learningStatus = learningStatus;
  await existing.save();
  await syncQuestion(userId, id, learningStatus);
  return mapQuestion(existing.toObject());
}

export async function deleteQuestion(userId: string, id: string) {
  const existing = await requireOwned(InterviewQuestion, userId, id, "Question");
  await LearningItem.updateMany({ userId, sourceQuestionId: id }, { sourceQuestionId: null });
  await existing.deleteOne();
  return { deleted: true };
}
