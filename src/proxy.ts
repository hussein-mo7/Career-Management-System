import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, verifyAccessToken } from "@/server/auth/token";

const PUBLIC_PAGES = new Set(["/", "/login", "/setup"]);
const PUBLIC_API = new Set([
  "/api/auth/login",
  "/api/auth/setup",
  "/api/auth/status",
  "/api/auth/logout",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  let session: { userId: string } | null = null;
  if (token) {
    try {
      session = await verifyAccessToken(token);
    } catch {
      session = null;
    }
  }

  if (pathname.startsWith("/api/")) {
    if (PUBLIC_API.has(pathname) || session) return NextResponse.next();
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 },
    );
  }

  if (!session && !PUBLIC_PAGES.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (session && (pathname === "/login" || pathname === "/setup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
