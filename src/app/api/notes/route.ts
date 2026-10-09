import { noteSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson, readListQuery } from "@/server/http";
import { createNote, listNotes } from "@/server/services/library";

export const GET = handle(async (request) => {
  const user = await requireUser();
  return listNotes(user.userId, readListQuery(request));
});

export const POST = handle(async (request) => {
  const user = await requireUser();
  return createNote(user.userId, await readJson(request, noteSchema));
});
