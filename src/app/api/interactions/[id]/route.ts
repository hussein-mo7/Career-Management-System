import { interactionSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson, readParamId } from "@/server/http";
import { deleteInteraction, updateInteraction } from "@/server/services/people";

export const PUT = handle(async (request, context) => {
  const user = await requireUser();
  return updateInteraction(
    user.userId,
    await readParamId(context),
    await readJson(request, interactionSchema),
  );
});

export const DELETE = handle(async (_request, context) => {
  const user = await requireUser();
  return deleteInteraction(user.userId, await readParamId(context));
});
