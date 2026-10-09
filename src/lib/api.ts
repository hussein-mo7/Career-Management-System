import { ApiError } from "@/lib/errors";

type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = { success: false; error?: { message?: string } };

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  let payload: ApiSuccess<T> | ApiFailure | null = null;
  try {
    payload = (await response.json()) as ApiSuccess<T> | ApiFailure;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.success !== true) {
    const message =
      payload && payload.success === false
        ? payload.error?.message || "Something went wrong"
        : "Something went wrong";
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      !path.startsWith("/api/auth/")
    ) {
      // Full navigation drops the in-memory query cache after the session ends.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    }
    throw new ApiError(message, response.status);
  }

  return payload.data;
}
