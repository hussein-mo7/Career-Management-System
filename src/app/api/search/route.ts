import { requireUser } from "@/server/auth/session";
import { handle } from "@/server/http";
import { searchRecords } from "@/server/services/search";

export const GET = handle(async (request) => {
  const user = await requireUser();
  const q = new URL(request.url).searchParams.get("q") || "";
  return searchRecords(user.userId, q);
});
