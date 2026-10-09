import { personSchema } from "@/schemas";
import { requireUser } from "@/server/auth/session";
import { handle, readJson, readListQuery } from "@/server/http";
import { createPerson, listPeople } from "@/server/services/people";

export const GET = handle(async (request) => {
  const user = await requireUser();
  return listPeople(user.userId, readListQuery(request));
});

export const POST = handle(async (request) => {
  const user = await requireUser();
  return createPerson(user.userId, await readJson(request, personSchema));
});
