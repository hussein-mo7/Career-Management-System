import { ApiError } from "@/lib/errors";
import { loginSchema } from "@/schemas";
import { setAuthCookie } from "@/server/auth/session";
import {
  assertLoginAllowed,
  clearLoginAttempts,
  recordLoginFailure,
} from "@/server/auth/rate-limit";
import { handle, readJson } from "@/server/http";
import { loginAccount } from "@/server/services/account";

function attemptKey(request: Request, email: string) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return `${ip}:${email.toLowerCase()}`;
}

export const POST = handle(async (request) => {
  const input = await readJson(request, loginSchema);
  const key = attemptKey(request, input.email);
  assertLoginAllowed(key);
  try {
    const result = await loginAccount(input.email, input.password);
    clearLoginAttempts(key);
    await setAuthCookie(result.token);
    return { user: result.user };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) recordLoginFailure(key);
    throw error;
  }
});
