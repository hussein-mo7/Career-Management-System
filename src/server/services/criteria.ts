import { ApiError } from "@/lib/errors";
import type { CriterionInput } from "@/schemas";
import { mapCriterion } from "@/server/domain/map";
import { Company, CompanyCriterion, type LooseDoc } from "@/server/models";
import { requireOwned } from "@/server/services/access";

export async function listCriteria(userId: string) {
  const items = await CompanyCriterion.find({ userId }).sort({ priority: 1, order: 1, createdAt: 1 }).lean();
  return items.map((item: LooseDoc) => mapCriterion(item));
}

export async function createCriterion(userId: string, input: CriterionInput) {
  const last = await CompanyCriterion.findOne({ userId, priority: input.priority }).sort({ order: -1 }).lean();
  const order = last && typeof last.order === "number" ? last.order + 1 : 0;
  const doc = await CompanyCriterion.create({ ...input, userId, order });
  return mapCriterion(doc.toObject());
}

export async function updateCriterion(userId: string, id: string, input: CriterionInput) {
  const existing = await requireOwned(CompanyCriterion, userId, id, "Criterion");
  const priorityChanged = existing.priority !== input.priority;
  let order = existing.order;
  if (priorityChanged) {
    const last = await CompanyCriterion.findOne({ userId, priority: input.priority }).sort({ order: -1 }).lean();
    order = last && typeof last.order === "number" ? last.order + 1 : 0;
  }
  existing.set({ ...input, order });
  await existing.save();
  return mapCriterion(existing.toObject());
}

export async function deleteCriterion(userId: string, id: string) {
  const existing = await requireOwned(CompanyCriterion, userId, id, "Criterion");
  await Company.updateMany({ userId }, { $pull: { criteriaEvaluations: { criterionId: existing._id } } });
  await existing.deleteOne();
  return { deleted: true };
}

export async function reorderCriteria(userId: string, priority: string, ids: string[]) {
  const owned = await CompanyCriterion.find({ userId, priority, _id: { $in: ids } }).select("_id");
  if (owned.length !== ids.length) throw new ApiError("Could not reorder those criteria", 400);
  await Promise.all(ids.map((id, order) => CompanyCriterion.updateOne({ _id: id, userId }, { order })));
  return listCriteria(userId);
}
