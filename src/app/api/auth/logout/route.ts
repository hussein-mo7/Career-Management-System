import { clearAuthCookie } from "@/server/auth/session";
import { handle } from "@/server/http";

export const POST = handle(async () => {
  await clearAuthCookie();
  return { loggedOut: true };
});
