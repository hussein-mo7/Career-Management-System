import { questionSchema, questionStatusSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson, readParamId } from "@/server/http";
import { deleteQuestion, updateQuestion, updateQuestionStatus } from "@/server/services/pipeline";

export const PUT = handle(async (request, context) => {
  const user = await requireUser();
  return updateQuestion(user.userId, await readParamId(context), await readJson(request, questionSchema));
});

export const PATCH = handle(async (request, context) => {
  const user = await requireUser();
  const input = await readJson(request, questionStatusSchema);
  return updateQuestionStatus(user.userId, await readParamId(context), input.learningStatus);
});

export const DELETE = handle(async (_request, context) => {
  const user = await requireUser();
  return deleteQuestion(user.userId, await readParamId(context));
});
