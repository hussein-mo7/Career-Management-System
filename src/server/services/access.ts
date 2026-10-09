import { Types } from "mongoose";
import { ApiError } from "@/lib/errors";
import { Application, Company, Interview, Person, type LooseModel } from "@/server/models";

export async function requireOwned(
  model: LooseModel,
  userId: string,
  id: string,
  label: string,
) {
  if (!Types.ObjectId.isValid(id)) throw new ApiError(`Invalid ${label.toLowerCase()}`, 400);
  const doc = await model.findOne({ _id: id, userId });
  if (!doc) throw new ApiError(`${label} not found`, 404);
  return doc;
}

export function optionalObjectId(id?: string | null) {
  if (!id) return null;
  if (!Types.ObjectId.isValid(id)) throw new ApiError("Invalid id", 400);
  return id;
}

export async function assertCompany(userId: string, id?: string | null, required = false) {
  if (!id) {
    if (required) throw new ApiError("Company is required", 422);
    return null;
  }
  return requireOwned(Company, userId, id, "Company");
}

export async function assertPerson(userId: string, id?: string | null) {
  if (!id) return null;
  return requireOwned(Person, userId, id, "Person");
}

export async function assertApplication(userId: string, id?: string | null) {
  if (!id) return null;
  return requireOwned(Application, userId, id, "Application");
}

export async function assertInterview(userId: string, id?: string | null, required = false) {
  if (!id) {
    if (required) throw new ApiError("Interview is required", 422);
    return null;
  }
  return requireOwned(Interview, userId, id, "Interview");
}
