import { Types } from "mongoose";
import { ApiError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { signAccessToken } from "@/server/auth/token";
import { DEFAULT_PROFILE, DEFAULT_CRITERIA, DEFAULT_LONG_TERM, DEFAULT_SKILLS, DEFAULT_VISION } from "@/server/domain/defaults";
import { mapCareer, mapUser } from "@/server/domain/map";
import { CareerProfile, CompanyCriterion, User, type LooseDoc } from "@/server/models";
import type { CareerInput } from "@/schemas";

export async function needsSetup() {
  const count = await User.countDocuments();
  return count === 0;
}

export async function createAccount(input: { name: string; email: string; password: string }) {
  if (!(await needsSetup())) throw new ApiError("An account already exists", 409);
  const passwordHash = await hashPassword(input.password);
  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    title: DEFAULT_PROFILE.title,
    currentGoal: DEFAULT_PROFILE.currentGoal,
    careerStatement: DEFAULT_PROFILE.careerStatement,
    targetRegions: DEFAULT_PROFILE.targetRegions,
  });
  await ensureCareer(user._id);
  await ensureCriteria(user._id);
  const token = await signAccessToken(String(user._id), user.email);
  return { token, user: mapUser(user.toObject()) };
}

export async function loginAccount(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user) throw new ApiError("Invalid email or password", 401);
  const passwordHash = user.get("passwordHash");
  if (typeof passwordHash !== "string" || !(await verifyPassword(password, passwordHash))) {
    throw new ApiError("Invalid email or password", 401);
  }
  const token = await signAccessToken(String(user._id), user.email);
  return { token, user: mapUser(user.toObject()) };
}

export async function getProfile(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError("Account not found", 401);
  return mapUser(user.toObject());
}

export async function updateProfile(
  userId: string,
  input: {
    name: string;
    title: string;
    currentGoal: string;
    location: string;
    targetRegions: string[];
    careerStatement: string;
  },
) {
  const user = await User.findByIdAndUpdate(userId, input, { returnDocument: "after" });
  if (!user) throw new ApiError("Account not found", 401);
  return mapUser(user.toObject());
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw new ApiError("Account not found", 401);
  const passwordHash = user.get("passwordHash");
  if (typeof passwordHash !== "string" || !(await verifyPassword(currentPassword, passwordHash))) {
    throw new ApiError("Current password is incorrect", 400);
  }
  user.set("passwordHash", await hashPassword(newPassword));
  await user.save();
  return { updated: true };
}

export async function ensureCareer(userId: Types.ObjectId | string) {
  const existing = await CareerProfile.findOne({ userId });
  if (existing) return existing;
  return CareerProfile.create({
    userId,
    vision: DEFAULT_VISION,
    longTermTarget: DEFAULT_LONG_TERM,
    currentTargetRole: "Full-Stack Developer",
    preferredRoles: DEFAULT_PROFILE.preferredRoles,
    preferredCompanySize: DEFAULT_PROFILE.preferredCompanySize,
    preferredWorkEnvironment: DEFAULT_PROFILE.preferredWorkEnvironment,
    preferredRegions: DEFAULT_PROFILE.targetRegions,
    remotePreference: DEFAULT_PROFILE.remotePreference,
    searchFocus: DEFAULT_PROFILE.searchFocus,
    skills: DEFAULT_SKILLS,
  });
}

export async function ensureCriteria(userId: Types.ObjectId | string) {
  const count = await CompanyCriterion.countDocuments({ userId });
  if (count > 0) return;
  const grouped = new Map<string, number>();
  await CompanyCriterion.insertMany(
    DEFAULT_CRITERIA.map((item: LooseDoc) => {
      const order = grouped.get(item.priority) ?? 0;
      grouped.set(item.priority, order + 1);
      return { ...item, notes: item.notes ?? "", order, userId, isDemo: false };
    }),
  );
}

export async function getCareer(userId: string) {
  const profile = await ensureCareer(userId);
  return mapCareer(profile.toObject());
}

export async function saveCareer(userId: string, input: CareerInput) {
  await ensureCareer(userId);
  const profile = await CareerProfile.findOneAndUpdate({ userId }, input, {
    returnDocument: "after",
  });
  if (!profile) throw new ApiError("Career profile not found", 404);
  return mapCareer(profile.toObject());
}

export async function updateSkillStatus(
  userId: string,
  input: { name: string; group: string; status: string },
) {
  const profile = await ensureCareer(userId);
  const skills = profile.skills.map((skill: LooseDoc) =>
    skill.name === input.name && skill.group === input.group ? { ...skill.toObject(), status: input.status } : skill.toObject(),
  );
  profile.skills = skills;
  await profile.save();
  return mapCareer(profile.toObject());
}
