import { cookies } from "next/headers";
import { ApiError } from "@/lib/errors";
import { AUTH_COOKIE, authCookieOptions, verifyAccessToken } from "@/server/auth/token";

export async function getSession() {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

export async function requireUser() {
  const session = await getSession();
  if (!session) throw new ApiError("Unauthorized", 401);
  return session;
}

export async function setAuthCookie(token: string) {
  const jar = await cookies();
  jar.set(AUTH_COOKIE, token, authCookieOptions());
}

export async function clearAuthCookie() {
  const jar = await cookies();
  jar.set(AUTH_COOKIE, "", { ...authCookieOptions(), maxAge: 0 });
}
