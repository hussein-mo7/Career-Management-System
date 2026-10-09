import { reorderSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson } from "@/server/http";
import { reorderCriteria } from "@/server/services/criteria";

export const POST = handle(async (request) => {
  const user = await requireUser();
  const input = await readJson(request, reorderSchema);
  return reorderCriteria(user.userId, input.priority, input.ids);
});
