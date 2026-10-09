import { criterionSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson, readParamId } from "@/server/http";
import { deleteCriterion, updateCriterion } from "@/server/services/criteria";

export const PATCH = handle(async (request, context) => {
  const user = await requireUser();
  const id = await readParamId(context);
  const input = await readJson(request, criterionSchema);
  return updateCriterion(user.userId, id, input);
});

export const DELETE = handle(async (_request, context) => {
  const user = await requireUser();
  const id = await readParamId(context);
  return deleteCriterion(user.userId, id);
});
