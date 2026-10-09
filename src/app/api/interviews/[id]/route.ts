import { ApiError } from "@/lib/errors";
import { interviewSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson, readParamId } from "@/server/http";
import { deleteInterview, getInterview, updateInterview } from "@/server/services/pipeline";

export const GET = handle(async (_request, context) => {
  const user = await requireUser();
  const item = await getInterview(user.userId, await readParamId(context));
  if (!item) throw new ApiError("Interview not found", 404);
  return item;
});

export const PUT = handle(async (request, context) => {
  const user = await requireUser();
  return updateInterview(
    user.userId,
    await readParamId(context),
    await readJson(request, interviewSchema),
  );
});

export const DELETE = handle(async (_request, context) => {
  const user = await requireUser();
  return deleteInterview(user.userId, await readParamId(context));
});
