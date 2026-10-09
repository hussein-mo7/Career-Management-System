import { interactionSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson } from "@/server/http";
import { createInteraction } from "@/server/services/people";
import { ApiError } from "@/lib/errors";

export const POST = handle(async (request) => {
  const user = await requireUser();
  const created = await createInteraction(user.userId, await readJson(request, interactionSchema));
  if (!created) throw new ApiError("Person not found", 404);
  return created;
});
