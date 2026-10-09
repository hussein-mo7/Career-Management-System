import { ApiError } from "@/lib/errors";
import { CATEGORY_LABELS, NOTE_CATEGORIES, QUESTION_CATEGORIES } from "@/lib/constants";
import type { LearningItemInput, NoteInput } from "@/schemas";
import { parseDateInput, startOfWeek } from "@/server/domain/career";
import { mapLearning, mapNote, mapQuestion, mapWeek } from "@/server/domain/map";
import {
  Application,
  CareerProfile,
  Company,
  Interaction,
  Interview,
  InterviewQuestion,
  LearningItem,
  Note,
  WeeklyProgress,
  type LooseDoc,
} from "@/server/models";
import { requireOwned } from "@/server/services/access";
import { containsRegex } from "@/server/http";
import type { LearningStatus } from "@/types";

export async function getLearningBoard(userId: string, url: URL) {
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");
  const regex = containsRegex((url.searchParams.get("q") || "").trim().slice(0, 80));
  const questionFilter: Record<string, unknown> = { userId };
  const itemFilter: Record<string, unknown> = { userId };
  if (status) {
    questionFilter.learningStatus = status;
    itemFilter.status = status;
  }
  if (category && (QUESTION_CATEGORIES as readonly string[]).includes(category)) {
    questionFilter.category = category;
  }
  if (category) itemFilter.category = category;
  if (regex) {
    questionFilter.question = regex;
    itemFilter.title = regex;
  }

  const [questions, items, career] = await Promise.all([
    InterviewQuestion.find(questionFilter)
      .sort({ updatedAt: -1 })
      .limit(200)
      .populate({ path: "interviewId", select: "role companyId", populate: { path: "companyId", select: "name" } })
      .lean(),
    LearningItem.find(itemFilter).sort({ updatedAt: -1 }).limit(200).lean(),
    CareerProfile.findOne({ userId }).lean(),
  ]);

  return {
    questions: questions.map((item: LooseDoc) => mapQuestion(item)),
    items: items.map((item: LooseDoc) => mapLearning(item)),
    skills: career?.skills ?? [],
  };
}

export async function createLearningItem(userId: string, input: LearningItemInput) {
  if (input.sourceQuestionId) {
    const question = await requireOwned(InterviewQuestion, userId, input.sourceQuestionId, "Question");
    const existing = await LearningItem.findOne({ userId, sourceQuestionId: input.sourceQuestionId });
    if (existing) {
      existing.set({
        title: input.title,
        category: input.category,
        status: input.status,
        notes: input.notes,
        topic: input.topic,
      });
      await existing.save();
      question.learningStatus = input.status;
      await question.save();
      return mapLearning(existing.toObject());
    }
    question.learningStatus = input.status;
    await question.save();
  }
  const doc = await LearningItem.create({
    userId,
    title: input.title,
    category: input.category,
    status: input.status,
    notes: input.notes,
    topic: input.topic,
    sourceQuestionId: input.sourceQuestionId || null,
  });
  return mapLearning(doc.toObject());
}

export async function updateLearningItem(userId: string, id: string, input: LearningItemInput) {
  const existing = await requireOwned(LearningItem, userId, id, "Learning item");
  if (input.sourceQuestionId) {
    await requireOwned(InterviewQuestion, userId, input.sourceQuestionId, "Question");
  }
  existing.set({
    title: input.title,
    category: input.category,
    status: input.status,
    notes: input.notes,
    topic: input.topic,
    sourceQuestionId: input.sourceQuestionId || null,
  });
  await existing.save();
  if (existing.sourceQuestionId) {
    await InterviewQuestion.updateOne(
      { _id: existing.sourceQuestionId, userId },
      { learningStatus: input.status satisfies LearningStatus },
    );
  }
  return mapLearning(existing.toObject());
}

export async function deleteLearningItem(userId: string, id: string) {
  const existing = await requireOwned(LearningItem, userId, id, "Learning item");
  await existing.deleteOne();
  return { deleted: true };
}

export async function listNotes(
  userId: string,
  query: { page: number; limit: number; skip: number; q: string; url: URL },
) {
  const filter: Record<string, unknown> = { userId };
  const category = query.url.searchParams.get("category");
  const tag = query.url.searchParams.get("tag");
  if (category && (NOTE_CATEGORIES as readonly string[]).includes(category)) filter.category = category;
  if (tag) filter.tags = tag;
  const regex = containsRegex(query.q);
  if (regex) filter.$or = [{ title: regex }, { content: regex }, { tags: regex }];
  const [items, total, tags] = await Promise.all([
    Note.find(filter).sort({ updatedAt: -1 }).skip(query.skip).limit(query.limit).lean(),
    Note.countDocuments(filter),
    Note.distinct("tags", { userId }),
  ]);
  return {
    items: items.map((item: LooseDoc) => mapNote(item)),
    page: query.page,
    limit: query.limit,
    total,
    tags: tags.filter(Boolean).sort(),
  };
}

export async function createNote(userId: string, input: NoteInput) {
  const doc = await Note.create({ ...input, userId });
  return mapNote(doc.toObject());
}

export async function updateNote(userId: string, id: string, input: NoteInput) {
  const existing = await requireOwned(Note, userId, id, "Note");
  existing.set(input);
  await existing.save();
  return mapNote(existing.toObject());
}

export async function deleteNote(userId: string, id: string) {
  const existing = await requireOwned(Note, userId, id, "Note");
  await existing.deleteOne();
  return { deleted: true };
}

export async function getProgress(userId: string) {
  const weekStart = startOfWeek();
  const [
    companiesResearched,
    qualifiedCompanies,
    networkingConversations,
    coffeeChats,
    applications,
    interviews,
    offerApplications,
    offerCompanies,
    learningItems,
    questions,
    masteredQuestions,
    weeks,
    current,
  ] = await Promise.all([
    Company.countDocuments({
      userId,
      status: { $in: ["researching", "qualified", "networking", "applied", "interview", "offer", "closed"] },
    }),
    Company.countDocuments({
      userId,
      status: { $in: ["qualified", "networking", "applied", "interview", "offer"] },
    }),
    Interaction.countDocuments({ userId }),
    Interaction.countDocuments({ userId, type: "coffee_chat" }),
    Application.countDocuments({ userId }),
    Interview.countDocuments({ userId }),
    Application.countDocuments({ userId, status: "offer" }),
    Company.countDocuments({ userId, status: "offer" }),
    LearningItem.countDocuments({ userId }),
    InterviewQuestion.countDocuments({ userId }),
    InterviewQuestion.countDocuments({ userId, learningStatus: "mastered" }),
    WeeklyProgress.find({ userId }).sort({ weekStart: -1 }).limit(12).lean(),
    WeeklyProgress.findOne({ userId, weekStart }).lean(),
  ]);

  return {
    metrics: {
      companiesResearched,
      qualifiedCompanies,
      networkingConversations,
      coffeeChats,
      applications,
      interviews,
      offers: Math.max(offerApplications, offerCompanies),
      learningItems: learningItems + questions,
      masteredQuestions,
    },
    currentWeek: current
      ? mapWeek(current)
      : {
          id: "",
          weekStart: weekStart.toISOString(),
          wins: "",
          lessons: "",
          focus: "",
          isDemo: false,
          updatedAt: weekStart.toISOString(),
        },
    weeks: weeks.map((item: LooseDoc) => mapWeek(item)),
  };
}

export async function saveWeek(
  userId: string,
  input: { weekStart: string; wins: string; lessons: string; focus: string },
) {
  const weekStart = parseDateInput(input.weekStart);
  if (!weekStart) throw new ApiError("Invalid week", 400);
  const doc = await WeeklyProgress.findOneAndUpdate(
    { userId, weekStart },
    { wins: input.wins, lessons: input.lessons, focus: input.focus },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  return mapWeek(doc.toObject());
}

export async function removeDemo(userId: string) {
  const interviews = await Interview.find({ userId, isDemo: true }).select("_id");
  const people = await (await import("@/server/models")).Person.find({ userId, isDemo: true }).select("_id");
  await InterviewQuestion.deleteMany({
    userId,
    $or: [{ isDemo: true }, { interviewId: { $in: interviews.map((item: LooseDoc) => item._id) } }],
  });
  const { Interaction: InteractionModel, CareerAction, Person } = await import("@/server/models");
  await InteractionModel.deleteMany({
    userId,
    $or: [{ isDemo: true }, { personId: { $in: people.map((item: LooseDoc) => item._id) } }],
  });
  await Promise.all([
    Company.deleteMany({ userId, isDemo: true }),
    Person.deleteMany({ userId, isDemo: true }),
    Application.deleteMany({ userId, isDemo: true }),
    CareerAction.deleteMany({ userId, isDemo: true }),
    Interview.deleteMany({ userId, isDemo: true }),
    LearningItem.deleteMany({ userId, isDemo: true }),
    Note.deleteMany({ userId, isDemo: true }),
    WeeklyProgress.deleteMany({ userId, isDemo: true }),
  ]);
  return { removed: true };
}

export function categoryLabel(value: string) {
  return CATEGORY_LABELS[value] ?? value;
}
