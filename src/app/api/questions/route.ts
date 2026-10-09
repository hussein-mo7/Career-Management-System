import { questionSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson } from "@/server/http";
import { createQuestion } from "@/server/services/pipeline";

export const POST = handle(async (request) => {
  const user = await requireUser();
  return createQuestion(user.userId, await readJson(request, questionSchema));
});
