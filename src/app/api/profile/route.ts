import { profileSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson } from "@/server/http";
import { getProfile, updateProfile } from "@/server/services/account";

export const GET = handle(async () => {
  const user = await requireUser();
  return getProfile(user.userId);
});

export const PATCH = handle(async (request) => {
  const user = await requireUser();
  const input = await readJson(request, profileSchema);
  return updateProfile(user.userId, input);
});
