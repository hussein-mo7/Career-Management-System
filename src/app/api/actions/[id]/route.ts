import { z } from "zod";
import { actionSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson, readParamId } from "@/server/http";
import { deleteAction, setActionStatus, updateAction } from "@/server/services/pipeline";

export const PUT = handle(async (request, context) => {
  const user = await requireUser();
  return updateAction(user.userId, await readParamId(context), await readJson(request, actionSchema));
});

export const PATCH = handle(async (request, context) => {
  const user = await requireUser();
  const input = await readJson(request, z.object({ status: z.enum(["pending", "done"]) }));
  return setActionStatus(user.userId, await readParamId(context), input.status);
});

export const DELETE = handle(async (_request, context) => {
  const user = await requireUser();
  return deleteAction(user.userId, await readParamId(context));
});
