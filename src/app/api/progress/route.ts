import { weeklySchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson } from "@/server/http";
import { getProgress, saveWeek } from "@/server/services/library";

export const GET = handle(async () => {
  const user = await requireUser();
  return getProgress(user.userId);
});

export const PUT = handle(async (request) => {
  const user = await requireUser();
  return saveWeek(user.userId, await readJson(request, weeklySchema));
});
