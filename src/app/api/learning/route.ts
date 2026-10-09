import { learningItemSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson } from "@/server/http";
import { createLearningItem, getLearningBoard } from "@/server/services/library";

export const GET = handle(async (request) => {
  const user = await requireUser();
  return getLearningBoard(user.userId, new URL(request.url));
});

export const POST = handle(async (request) => {
  const user = await requireUser();
  return createLearningItem(user.userId, await readJson(request, learningItemSchema));
});
