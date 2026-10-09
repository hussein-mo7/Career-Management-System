import { skillStatusSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson } from "@/server/http";
import { updateSkillStatus } from "@/server/services/account";

export const PATCH = handle(async (request) => {
  const user = await requireUser();
  const input = await readJson(request, skillStatusSchema);
  return updateSkillStatus(user.userId, input);
});
