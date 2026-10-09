import { learningItemSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson, readParamId } from "@/server/http";
import { deleteLearningItem, updateLearningItem } from "@/server/services/library";

export const PUT = handle(async (request, context) => {
  const user = await requireUser();
  return updateLearningItem(
    user.userId,
    await readParamId(context),
    await readJson(request, learningItemSchema),
  );
});

export const DELETE = handle(async (_request, context) => {
  const user = await requireUser();
  return deleteLearningItem(user.userId, await readParamId(context));
});
