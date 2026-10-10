import type { InteractionInput, PersonInput } from "@/schemas";
import { RELATIONSHIP_TYPES } from "@/lib/constants";
import { parseDateInput } from "@/server/domain/career";
import { mapInteraction, mapPerson } from "@/server/domain/map";
import { CareerAction, Interaction, Person, type LooseDoc } from "@/server/models";
import { assertPerson, requireOwned } from "@/server/services/access";
import { resolveCompanyLink } from "@/server/services/company-link";
import { containsRegex } from "@/server/http";

async function personPayload(userId: string, input: PersonInput) {
  const company = await resolveCompanyLink(userId, input);
  return {
    name: input.name,
    role: input.role,
    companyName: company.companyName,
    companyId: company.companyId,
    linkedin: input.linkedin,
    howWeMet: input.howWeMet,
    relationshipType: input.relationshipType,
    notes: input.notes,
  };
}

export async function listPeople(
  userId: string,
  query: { page: number; limit: number; skip: number; q: string; url: URL },
) {
  const filter: Record<string, unknown> = { userId };
  const relationship = query.url.searchParams.get("relationship");
  const companyId = query.url.searchParams.get("companyId");
  if (relationship && (RELATIONSHIP_TYPES as readonly string[]).includes(relationship)) {
    filter.relationshipType = relationship;
  }
  if (companyId) filter.companyId = companyId;
  const regex = containsRegex(query.q);
  if (regex) filter.name = regex;
  const [items, total] = await Promise.all([
    Person.find(filter)
      .sort({ updatedAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .populate("companyId", "name")
      .lean(),
    Person.countDocuments(filter),
  ]);
  return { items: items.map((item: LooseDoc) => mapPerson(item)), page: query.page, limit: query.limit, total };
}

export async function getPerson(userId: string, id: string) {
  await requireOwned(Person, userId, id, "Person");
  const [person, interactions] = await Promise.all([
    Person.findOne({ _id: id, userId }).populate("companyId", "name").lean(),
    Interaction.find({ userId, personId: id }).sort({ date: -1, createdAt: -1 }).lean(),
  ]);
  if (!person) return null;
  return { person: mapPerson(person), interactions: interactions.map((item: LooseDoc) => mapInteraction(item)) };
}

export async function createPerson(userId: string, input: PersonInput) {
  const doc = await Person.create({ ...(await personPayload(userId, input)), userId });
  const populated = await Person.findById(doc._id).populate("companyId", "name").lean();
  return mapPerson(populated ?? doc.toObject());
}

export async function updatePerson(userId: string, id: string, input: PersonInput) {
  const existing = await requireOwned(Person, userId, id, "Person");
  existing.set(await personPayload(userId, input));
  await existing.save();
  const populated = await Person.findById(existing._id).populate("companyId", "name").lean();
  return mapPerson(populated ?? existing.toObject());
}

export async function deletePerson(userId: string, id: string) {
  const existing = await requireOwned(Person, userId, id, "Person");
  await Interaction.deleteMany({ userId, personId: id });
  await CareerAction.deleteMany({ userId, personId: id });
  const { Application } = await import("@/server/models");
  await Application.updateMany({ userId, contactId: id }, { contactId: null });
  await existing.deleteOne();
  return { deleted: true };
}

export async function createInteraction(userId: string, input: InteractionInput) {
  const person = await assertPerson(userId, input.personId);
  if (!person) return null;
  const doc = await Interaction.create({
    userId,
    personId: input.personId,
    date: parseDateInput(input.date),
    type: input.type,
    notes: input.notes,
    learned: input.learned,
    improve: input.improve,
    nextStep: input.nextStep,
    rating: input.rating,
    reflection: input.reflection,
  });
  if (input.createAction && input.nextStep) {
    const existing = await CareerAction.findOne({
      userId,
      personId: input.personId,
      title: input.nextStep,
      status: "pending",
    });
    if (!existing) {
      await CareerAction.create({
        userId,
        title: input.nextStep,
        personId: input.personId,
        companyId: person.companyId,
        status: "pending",
      });
    }
  }
  return mapInteraction(doc.toObject());
}

export async function updateInteraction(userId: string, id: string, input: InteractionInput) {
  const existing = await requireOwned(Interaction, userId, id, "Conversation");
  await assertPerson(userId, input.personId);
  existing.set({
    personId: input.personId,
    date: parseDateInput(input.date),
    type: input.type,
    notes: input.notes,
    learned: input.learned,
    improve: input.improve,
    nextStep: input.nextStep,
    rating: input.rating,
    reflection: input.reflection,
  });
  await existing.save();
  return mapInteraction(existing.toObject());
}

export async function deleteInteraction(userId: string, id: string) {
  const existing = await requireOwned(Interaction, userId, id, "Conversation");
  await existing.deleteOne();
  return { deleted: true };
}
