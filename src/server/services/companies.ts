import type { CompanyInput } from "@/schemas";
import { parseDateInput } from "@/server/domain/career";
import { mapApplication, mapCompany, mapPerson } from "@/server/domain/map";
import {
  Application,
  CareerAction,
  Company,
  Interaction,
  Interview,
  InterviewQuestion,
  Person,
  type LooseDoc,
} from "@/server/models";
import { requireOwned } from "@/server/services/access";
import { containsRegex } from "@/server/http";
import type { ActivityItem } from "@/types";
import { COMPANY_STATUSES, COMPANY_TYPES, REMOTE_MODELS } from "@/lib/constants";

function companyPayload(input: CompanyInput) {
  return {
    name: input.name,
    website: input.website,
    location: input.location,
    country: input.country,
    industry: input.industry,
    types: input.types,
    size: input.size,
    remoteModel: input.remoteModel,
    whyInterests: input.whyInterests,
    nextAction: input.nextAction,
    nextActionDate: parseDateInput(input.nextActionDate),
    status: input.status,
    fitRating: input.fitRating,
  };
}

export async function listCompanies(
  userId: string,
  query: { page: number; limit: number; skip: number; q: string; url: URL },
) {
  const filter: Record<string, unknown> = { userId };
  const status = query.url.searchParams.get("status");
  const type = query.url.searchParams.get("type");
  const remote = query.url.searchParams.get("remote");
  const fit = query.url.searchParams.get("fit");
  const country = query.url.searchParams.get("country");
  if (status && (COMPANY_STATUSES as readonly string[]).includes(status)) filter.status = status;
  if (type && (COMPANY_TYPES as readonly string[]).includes(type)) filter.types = type;
  if (remote && (REMOTE_MODELS as readonly string[]).includes(remote)) filter.remoteModel = remote;
  if (fit && /^[1-5]$/.test(fit)) filter.fitRating = Number(fit);
  if (country) filter.country = country;
  const regex = containsRegex(query.q);
  if (regex) filter.name = regex;

  const [items, total, countries] = await Promise.all([
    Company.find(filter).sort({ updatedAt: -1 }).skip(query.skip).limit(query.limit).lean(),
    Company.countDocuments(filter),
    Company.distinct("country", { userId, country: { $nin: ["", null] } }),
  ]);

  return {
    items: items.map((item: LooseDoc) => mapCompany(item)),
    page: query.page,
    limit: query.limit,
    total,
    facets: { countries: countries.filter(Boolean).sort() },
  };
}

export async function getCompany(userId: string, id: string) {
  const company = await requireOwned(Company, userId, id, "Company");
  const [people, applications, interviews, actions, interactions] = await Promise.all([
    Person.find({ userId, companyId: id }).sort({ name: 1 }).populate("companyId", "name").lean(),
    Application.find({ userId, companyId: id }).sort({ updatedAt: -1 }).populate("companyId", "name").populate("contactId", "name").lean(),
    Interview.find({ userId, companyId: id }).sort({ date: -1 }).populate("companyId", "name").populate("applicationId", "role").lean(),
    CareerAction.find({ userId, companyId: id }).sort({ dueDate: 1 }).lean(),
    Interaction.find({ userId }).sort({ date: -1 }).limit(40).populate("personId", "name companyId").lean(),
  ]);

  const personIds = new Set(people.map((person: LooseDoc) => String(person._id)));
  const activity: ActivityItem[] = [
    ...interactions
      .filter((item: LooseDoc) => {
        const person = item.personId;
        const personId =
          person && typeof person === "object" && "_id" in person ? String(person._id) : String(person);
        return personIds.has(personId);
      })
      .map((item: LooseDoc) => {
        const person = item.personId as { name?: string };
        return {
          id: String(item._id),
          type: "Conversation",
          title: person?.name || "Conversation",
          detail: item.learned || item.notes || item.type,
          date: (item.date ?? item.createdAt)?.toISOString?.() ?? new Date().toISOString(),
          href: `/networking/${personIds.has(String((item.personId as { _id?: unknown })._id)) ? (item.personId as { _id: unknown })._id : ""}`,
        };
      }),
    ...applications.map((item: LooseDoc) => ({
      id: String(item._id),
      type: "Application",
      title: item.role,
      detail: item.status,
      date: (item.dateApplied ?? item.createdAt).toISOString(),
      href: `/applications/${item._id}`,
    })),
    ...interviews.map((item: LooseDoc) => ({
      id: String(item._id),
      type: "Interview",
      title: item.role,
      detail: item.type,
      date: (item.date ?? item.createdAt).toISOString(),
      href: `/interviews/${item._id}`,
    })),
    ...actions.map((item: LooseDoc) => ({
      id: String(item._id),
      type: "Action",
      title: item.title,
      detail: item.status,
      date: (item.dueDate ?? item.createdAt).toISOString(),
      href: `/companies/${id}`,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 12);

  return {
    company: mapCompany(company.toObject()),
    people: people.map((item: LooseDoc) => mapPerson(item)),
    applications: applications.map((item: LooseDoc) => mapApplication(item)),
    activity,
  };
}

export async function createCompany(userId: string, input: CompanyInput) {
  const doc = await Company.create({ ...companyPayload(input), userId });
  return mapCompany(doc.toObject());
}

export async function updateCompany(userId: string, id: string, input: CompanyInput) {
  const existing = await requireOwned(Company, userId, id, "Company");
  existing.set(companyPayload(input));
  await existing.save();
  return mapCompany(existing.toObject());
}

export async function deleteCompany(userId: string, id: string) {
  const existing = await requireOwned(Company, userId, id, "Company");
  const people = await Person.find({ userId, companyId: id }).select("_id");
  const personIds = people.map((person: LooseDoc) => person._id);
  const applications = await Application.find({ userId, companyId: id }).select("_id");
  const applicationIds = applications.map((item: LooseDoc) => item._id);
  const interviews = await Interview.find({ userId, companyId: id }).select("_id");
  const interviewIds = interviews.map((item: LooseDoc) => item._id);
  await InterviewQuestion.deleteMany({ userId, interviewId: { $in: interviewIds } });
  await Interview.deleteMany({ userId, companyId: id });
  await Interaction.deleteMany({ userId, personId: { $in: personIds } });
  await Person.deleteMany({ userId, companyId: id });
  await Application.deleteMany({ userId, companyId: id });
  await CareerAction.deleteMany({
    userId,
    $or: [{ companyId: id }, { personId: { $in: personIds } }, { applicationId: { $in: applicationIds } }],
  });
  await existing.deleteOne();
  return { deleted: true };
}
