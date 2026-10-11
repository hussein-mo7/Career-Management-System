import { buildDashboardInsights, endOfWeek, startOfWeek } from "@/server/domain/career";
import { refOf } from "@/server/domain/map";
import {
  Application,
  CareerAction,
  CareerProfile,
  Company,
  Interaction,
  Interview,
  Person,
  WeeklyProgress,
  type LooseDoc,
} from "@/server/models";
import type { ActivityItem, DashboardData, NextActionItem } from "@/types";

const ACTIVE_APPLICATIONS = ["applied", "screening", "technical_interview", "final_interview", "offer"];
const QUALIFIED = ["qualified", "networking", "applied", "interview", "offer"];

export async function getDashboard(userId: string): Promise<DashboardData> {
  const weekStart = startOfWeek();
  const weekEnd = endOfWeek(weekStart);
  const since = new Date();
  since.setDate(since.getDate() - 21);

  const [
    career,
    targetCompanies,
    qualifiedCompanies,
    conversations,
    applications,
    interviews,
    offerApplications,
    offerCompanies,
    activeApplications,
    dueActions,
    pendingActions,
    companiesWithAction,
    applicationsWithAction,
    recentCompanies,
    recentPeople,
    recentApplications,
    recentInterviews,
    recentInteractions,
    weekApplications,
    weekConversations,
    weekInterviews,
    weekDoc,
    recentContacts,
    pendingPeople,
  ] = await Promise.all([
    CareerProfile.findOne({ userId }).lean(),
    Company.countDocuments({ userId, status: { $ne: "closed" } }),
    Company.countDocuments({ userId, status: { $in: QUALIFIED } }),
    Interaction.countDocuments({ userId }),
    Application.countDocuments({ userId, status: { $in: ACTIVE_APPLICATIONS } }),
    Interview.countDocuments({ userId, result: { $ne: "withdrawn" } }),
    Application.find({ userId, status: "offer" }).distinct("companyId"),
    Company.find({ userId, status: "offer" }).distinct("_id"),
    Application.countDocuments({ userId, status: { $in: ACTIVE_APPLICATIONS } }),
    CareerAction.countDocuments({
      userId,
      status: "pending",
      dueDate: { $gte: weekStart, $lt: weekEnd },
    }),
    CareerAction.find({ userId, status: "pending" })
      .sort({ dueDate: 1, createdAt: -1 })
      .limit(12)
      .populate("companyId", "name")
      .populate("personId", "name")
      .lean(),
    Company.find({ userId, nextAction: { $nin: ["", null] } }).sort({ nextActionDate: 1 }).limit(8).lean(),
    Application.find({ userId, nextAction: { $nin: ["", null] } })
      .sort({ followUpDate: 1 })
      .limit(8)
      .populate("companyId", "name")
      .lean(),
    Company.find({ userId }).sort({ createdAt: -1 }).limit(4).lean(),
    Person.find({ userId }).sort({ createdAt: -1 }).limit(4).lean(),
    Application.find({ userId }).sort({ createdAt: -1 }).limit(4).populate("companyId", "name").lean(),
    Interview.find({ userId }).sort({ createdAt: -1 }).limit(4).populate("companyId", "name").lean(),
    Interaction.find({ userId }).sort({ createdAt: -1 }).limit(4).populate("personId", "name").lean(),
    Application.countDocuments({ userId, createdAt: { $gte: weekStart, $lt: weekEnd } }),
    Interaction.countDocuments({ userId, createdAt: { $gte: weekStart, $lt: weekEnd } }),
    Interview.countDocuments({ userId, createdAt: { $gte: weekStart, $lt: weekEnd } }),
    WeeklyProgress.findOne({ userId, weekStart }).lean(),
    Interaction.find({ userId, createdAt: { $gte: since }, nextStep: { $nin: ["", null] } }).select("personId").lean(),
    CareerAction.find({ userId, status: "pending", personId: { $ne: null } }).distinct("personId"),
  ]);

  const contactIds = [...new Set(recentContacts.map((item: LooseDoc) => String(item.personId)))];
  const pendingSet = new Set(pendingPeople.map(String));
  const staleNetworking = contactIds.filter((id) => !pendingSet.has(id)).length;
  const offerIds = new Set([...offerApplications.map(String), ...offerCompanies.map(String)]);

  const actionKeys = new Set(
    pendingActions.map((item: LooseDoc) => `${item.companyId ? String(item.companyId && typeof item.companyId === "object" && "_id" in item.companyId ? item.companyId._id : item.companyId) : ""}|${item.title}`),
  );

  const nextActions: NextActionItem[] = [
    ...pendingActions.map((item: LooseDoc) => {
      const company = refOf(item.companyId);
      const person = refOf(item.personId);
      const href = company ? `/companies/${company.id}` : person ? `/networking/${person.id}` : "/dashboard";
      return {
        id: `action-${item._id}`,
        source: "action" as const,
        title: item.title,
        dueDate: item.dueDate ? new Date(item.dueDate).toISOString() : null,
        href,
        related: company?.name || person?.name || "Action",
      };
    }),
    ...companiesWithAction
      .filter((item: LooseDoc) => !actionKeys.has(`${item._id}|${item.nextAction}`))
      .map((item: LooseDoc) => ({
        id: `company-${item._id}`,
        source: "company" as const,
        title: item.nextAction,
        dueDate: item.nextActionDate ? new Date(item.nextActionDate).toISOString() : null,
        href: `/companies/${item._id}`,
        related: item.name,
      })),
    ...applicationsWithAction.map((item: LooseDoc) => {
      const company = refOf(item.companyId);
      return {
        id: `application-${item._id}`,
        source: "application" as const,
        title: item.nextAction,
        dueDate: item.followUpDate ? new Date(item.followUpDate).toISOString() : null,
        href: `/applications/${item._id}`,
        related: company?.name || item.role,
      };
    }),
  ].slice(0, 8);

  const activity: ActivityItem[] = [
    ...recentCompanies.map((item: LooseDoc) => ({
      id: `company-${item._id}`,
      type: "Company",
      title: item.name,
      detail: "Added to your target list",
      date: new Date(item.createdAt).toISOString(),
      href: `/companies/${item._id}`,
    })),
    ...recentPeople.map((item: LooseDoc) => ({
      id: `person-${item._id}`,
      type: "Person",
      title: item.name,
      detail: item.role || "New contact",
      date: new Date(item.createdAt).toISOString(),
      href: `/networking/${item._id}`,
    })),
    ...recentApplications.map((item: LooseDoc) => ({
      id: `application-${item._id}`,
      type: "Application",
      title: item.role,
      detail: refOf(item.companyId)?.name || "Application",
      date: new Date(item.createdAt).toISOString(),
      href: `/applications/${item._id}`,
    })),
    ...recentInterviews.map((item: LooseDoc) => ({
      id: `interview-${item._id}`,
      type: "Interview",
      title: item.role,
      detail: refOf(item.companyId)?.name || item.type,
      date: new Date(item.createdAt).toISOString(),
      href: `/interviews/${item._id}`,
    })),
    ...recentInteractions.map((item: LooseDoc) => {
      const person = refOf(item.personId);
      return {
        id: `interaction-${item._id}`,
        type: "Conversation",
        title: person?.name || "Conversation",
        detail: item.learned || "Networking note",
        date: new Date(item.createdAt).toISOString(),
        href: person ? `/networking/${person.id}` : "/networking",
      };
    }),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  return {
    direction: {
      currentTargetRole: career?.currentTargetRole || "Full-Stack Developer",
      longTermTarget: career?.longTermTarget || "Senior Full-Stack Developer → Potential Tech Lead",
      searchFocus: career?.searchFocus || "",
    },
    pipeline: {
      targetCompanies,
      qualifiedCompanies,
      networkingConversations: conversations,
      applications,
      interviews,
      offers: offerIds.size,
    },
    nextActions,
    activity,
    insights: buildDashboardInsights({
      followUpsDueThisWeek: dueActions,
      staleNetworking,
      activeApplications,
    }),
    week: {
      weekStart: weekStart.toISOString(),
      applications: weekApplications,
      conversations: weekConversations,
      interviews: weekInterviews,
      wins: weekDoc?.wins || "",
      lessons: weekDoc?.lessons || "",
      focus: weekDoc?.focus || "",
    },
  };
}
