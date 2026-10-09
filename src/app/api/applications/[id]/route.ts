import { ApiError } from "@/lib/errors";
import { applicationSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson, readParamId } from "@/server/http";
import { deleteApplication, getApplication, updateApplication } from "@/server/services/pipeline";

export const GET = handle(async (_request, context) => {
  const user = await requireUser();
  const item = await getApplication(user.userId, await readParamId(context));
  if (!item) throw new ApiError("Application not found", 404);
  return item;
});

export const PUT = handle(async (request, context) => {
  const user = await requireUser();
  return updateApplication(
    user.userId,
    await readParamId(context),
    await readJson(request, applicationSchema),
  );
});

export const DELETE = handle(async (_request, context) => {
  const user = await requireUser();
  return deleteApplication(user.userId, await readParamId(context));
});
