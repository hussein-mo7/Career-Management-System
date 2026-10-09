import { criterionSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson } from "@/server/http";
import { createCriterion, listCriteria } from "@/server/services/criteria";
import { ensureCriteria } from "@/server/services/account";

export const GET = handle(async () => {
  const user = await requireUser();
  await ensureCriteria(user.userId);
  return listCriteria(user.userId);
});

export const POST = handle(async (request) => {
  const user = await requireUser();
  const input = await readJson(request, criterionSchema);
  return createCriterion(user.userId, input);
});
