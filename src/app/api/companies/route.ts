import { companySchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson, readListQuery } from "@/server/http";
import { createCompany, listCompanies } from "@/server/services/companies";

export const GET = handle(async (request) => {
  const user = await requireUser();
  return listCompanies(user.userId, readListQuery(request));
});

export const POST = handle(async (request) => {
  const user = await requireUser();
  const input = await readJson(request, companySchema);
  return createCompany(user.userId, input);
});
