import { evaluationSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson, readParamId } from "@/server/http";
import { updateCompanyEvaluations } from "@/server/services/companies";

export const PUT = handle(async (request, context) => {
  const user = await requireUser();
  const input = await readJson(request, evaluationSchema);
  return updateCompanyEvaluations(user.userId, await readParamId(context), input.evaluations);
});
