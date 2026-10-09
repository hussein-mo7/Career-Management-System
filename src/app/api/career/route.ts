import { careerSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson } from "@/server/http";
import { getCareer, saveCareer } from "@/server/services/account";

export const GET = handle(async () => {
  const user = await requireUser();
  return getCareer(user.userId);
});

export const PUT = handle(async (request) => {
  const user = await requireUser();
  const input = await readJson(request, careerSchema);
  return saveCareer(user.userId, input);
});
