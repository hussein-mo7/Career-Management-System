import { requireUser } from "@/server/auth/session";
import { handle } from "@/server/http";
import { getProfile } from "@/server/services/account";

export const GET = handle(async () => {
  const user = await requireUser();
  return getProfile(user.userId);
});
