import { setupSchema } from "@/schemas";
import { setAuthCookie } from "@/server/auth/session";
import { handle, readJson } from "@/server/http";
import { createAccount } from "@/server/services/account";

export const POST = handle(async (request) => {
  const input = await readJson(request, setupSchema);
  const result = await createAccount(input);
  await setAuthCookie(result.token);
  return { user: result.user };
});
