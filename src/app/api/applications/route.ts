import { applicationSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson, readListQuery } from "@/server/http";
import { createApplication, listApplications } from "@/server/services/pipeline";

export const GET = handle(async (request) => {
  const user = await requireUser();
  return listApplications(user.userId, readListQuery(request));
});

export const POST = handle(async (request) => {
  const user = await requireUser();
  return createApplication(user.userId, await readJson(request, applicationSchema));
});
