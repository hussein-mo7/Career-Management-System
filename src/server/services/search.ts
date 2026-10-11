import { containsRegex } from "@/server/http";
import {
  Application,
  Company,
  Interview,
  Person,
  type LooseDoc,
} from "@/server/models";

export async function searchRecords(userId: string, rawQuery: string) {
  const q = rawQuery.trim().slice(0, 80);
  const regex = containsRegex(q);
  if (!regex || q.length < 2) return { query: q, results: [] };

  const [companies, people, applications, interviews] = await Promise.all([
    Company.find({ userId, name: regex }).select("name status").limit(5).lean(),
    Person.find({ userId, name: regex }).select("name role").limit(5).lean(),
    Application.find({ userId, role: regex }).select("role").populate("companyId", "name").limit(5).lean(),
    Interview.find({ userId, role: regex }).select("role").populate("companyId", "name").limit(5).lean(),
  ]);

  return {
    query: q,
    results: [
      ...companies.map((item: LooseDoc) => ({
        id: String(item._id),
        type: "Company",
        title: item.name,
        href: `/companies/${item._id}`,
      })),
      ...people.map((item: LooseDoc) => ({
        id: String(item._id),
        type: "Person",
        title: item.name,
        href: `/networking/${item._id}`,
      })),
      ...applications.map((item: LooseDoc) => ({
        id: String(item._id),
        type: "Application",
        title: item.role,
        href: `/applications/${item._id}`,
      })),
      ...interviews.map((item: LooseDoc) => ({
        id: String(item._id),
        type: "Interview",
        title: item.role,
        href: `/interviews/${item._id}`,
      })),
    ],
  };
}
