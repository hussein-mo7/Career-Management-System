import { ApiError } from "@/lib/errors";
import { parseDateInput, startOfWeek } from "@/server/domain/career";
import { mapWeek } from "@/server/domain/map";
import {
  Application,
  Company,
  Interaction,
  Interview,
  InterviewQuestion,
  LearningItem,
  Note,
  WeeklyProgress,
  type LooseDoc,
} from "@/server/models";

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
