import { actionSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson } from "@/server/http";
import { createAction, listActions } from "@/server/services/pipeline";

export const GET = handle(async (request) => {
  const user = await requireUser();
  return listActions(user.userId, new URL(request.url));
});

export const POST = handle(async (request) => {
  const user = await requireUser();
  return createAction(user.userId, await readJson(request, actionSchema));
});
