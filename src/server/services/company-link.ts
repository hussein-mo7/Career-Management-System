import { Company } from "@/server/models";
import { assertCompany } from "@/server/services/access";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function resolveCompanyLink(
  userId: string,
  input: { companyName?: string; companyId?: string | null },
) {
  const companyName = (input.companyName || "").trim();
  let companyId = input.companyId || null;

  if (companyName) {
    const match = await Company.findOne({
      userId,
      name: { $regex: new RegExp(`^${escapeRegex(companyName)}$`, "i") },
    }).lean();
    companyId = match ? match._id : null;
    return { companyName, companyId };
  }

  if (companyId) {
    await assertCompany(userId, companyId);
    const company = await Company.findOne({ _id: companyId, userId }).select("name").lean();
    return { companyName: company && typeof company.name === "string" ? company.name : "", companyId };
  }

  return { companyName: "", companyId: null };
}
