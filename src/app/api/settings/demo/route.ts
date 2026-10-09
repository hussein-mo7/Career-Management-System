import { requireUser } from "@/server/auth/session";
import { handle } from "@/server/http";
import { removeDemo } from "@/server/services/library";

export const DELETE = handle(async () => {
  const user = await requireUser();
  return removeDemo(user.userId);
});
