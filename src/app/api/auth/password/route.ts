import { passwordChangeSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson } from "@/server/http";
import { changePassword } from "@/server/services/account";

export const POST = handle(async (request) => {
  const user = await requireUser();
  const input = await readJson(request, passwordChangeSchema);
  return changePassword(user.userId, input.currentPassword, input.newPassword);
});
