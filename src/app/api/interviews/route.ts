import { interviewSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson, readListQuery } from "@/server/http";
import { createInterview, listInterviews } from "@/server/services/pipeline";

export const GET = handle(async (request) => {
  const user = await requireUser();
  return listInterviews(user.userId, readListQuery(request));
});

export const POST = handle(async (request) => {
  const user = await requireUser();
  return createInterview(user.userId, await readJson(request, interviewSchema));
});
