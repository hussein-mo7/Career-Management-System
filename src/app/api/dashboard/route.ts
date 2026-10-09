import { requireUser } from "@/server/auth/session";
import { handle } from "@/server/http";
import { getDashboard } from "@/server/services/dashboard";

export const GET = handle(async () => {
  const user = await requireUser();
  return getDashboard(user.userId);
});
