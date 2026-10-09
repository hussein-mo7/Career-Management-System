import { noteSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson, readParamId } from "@/server/http";
import { deleteNote, updateNote } from "@/server/services/library";

export const PUT = handle(async (request, context) => {
  const user = await requireUser();
  return updateNote(user.userId, await readParamId(context), await readJson(request, noteSchema));
});

export const DELETE = handle(async (_request, context) => {
  const user = await requireUser();
  return deleteNote(user.userId, await readParamId(context));
});
