import { companySchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson, readParamId } from "@/server/http";
import { deleteCompany, getCompany, updateCompany } from "@/server/services/companies";

export const GET = handle(async (_request, context) => {
  const user = await requireUser();
  return getCompany(user.userId, await readParamId(context));
});

export const PUT = handle(async (request, context) => {
  const user = await requireUser();
  const input = await readJson(request, companySchema);
  return updateCompany(user.userId, await readParamId(context), input);
});

export const DELETE = handle(async (_request, context) => {
  const user = await requireUser();
  return deleteCompany(user.userId, await readParamId(context));
});
