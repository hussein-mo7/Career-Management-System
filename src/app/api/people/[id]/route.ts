import { personSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson, readParamId } from "@/server/http";
import { deletePerson, getPerson, updatePerson } from "@/server/services/people";
import { ApiError } from "@/lib/errors";

export const GET = handle(async (_request, context) => {
  const user = await requireUser();
  const person = await getPerson(user.userId, await readParamId(context));
  if (!person) throw new ApiError("Person not found", 404);
  return person;
});

export const PUT = handle(async (request, context) => {
  const user = await requireUser();
  return updatePerson(user.userId, await readParamId(context), await readJson(request, personSchema));
});

export const DELETE = handle(async (_request, context) => {
  const user = await requireUser();
  return deletePerson(user.userId, await readParamId(context));
});
