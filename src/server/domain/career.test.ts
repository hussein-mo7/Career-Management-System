import { describe, expect, it } from "vitest";
import { applicationSchema, companySchema, loginSchema } from "@/schemas";
import {
  buildDashboardInsights,
  canTransitionLearningStatus,
  parseDateInput,
  startOfWeek,
} from "@/server/domain/career";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { signAccessToken, verifyAccessToken } from "@/server/auth/token";

describe("company creation", () => {
  it("accepts a company with only a name", () => {
    const parsed = companySchema.parse({ name: "Northwind Labs" });
    expect(parsed.name).toBe("Northwind Labs");
    expect(parsed.status).toBe("discovered");
    expect(parsed.fitRating).toBeNull();
    expect(parsed.remoteModel).toBe("unknown");
  });

  it("rejects a blank company name", () => {
    const result = companySchema.safeParse({ name: " " });
    expect(result.success).toBe(false);
  });

  it("stores an optional fit rating and date", () => {
    const parsed = companySchema.parse({
      name: "Harbor Devtools",
      fitRating: "5",
      nextActionDate: "2026-10-12",
      website: "https://harbor.example",
    });
    expect(parsed.fitRating).toBe(5);
    expect(parsed.nextActionDate).toBe("2026-10-12");
    expect(parseDateInput(parsed.nextActionDate)?.toISOString()).toBe("2026-10-12T00:00:00.000Z");
  });
});

describe("application creation", () => {
  it("requires a company and role", () => {
    const result = applicationSchema.safeParse({ role: "Full-Stack Developer" });
    expect(result.success).toBe(false);
  });

  it("accepts a linked application", () => {
    const parsed = applicationSchema.parse({
      companyId: "64b7f3c2a1d4e5f678901234",
      role: "Backend Developer",
      status: "applied",
    });
    expect(parsed.role).toBe("Backend Developer");
    expect(parsed.status).toBe("applied");
  });
});

describe("learning status transitions", () => {
  it("allows movement between every learning status", () => {
    expect(canTransitionLearningStatus("need_to_learn", "practicing")).toBe(true);
    expect(canTransitionLearningStatus("practicing", "comfortable")).toBe(true);
    expect(canTransitionLearningStatus("comfortable", "mastered")).toBe(true);
    expect(canTransitionLearningStatus("mastered", "need_to_learn")).toBe(true);
  });

  it("rejects staying on the same status", () => {
    expect(canTransitionLearningStatus("practicing", "practicing")).toBe(false);
  });
});

describe("dashboard insights", () => {
  it("builds messages from real counts", () => {
    const insights = buildDashboardInsights({
      followUpsDueThisWeek: 3,
      needToLearn: 7,
      staleNetworking: 2,
      activeApplications: 4,
      topLearningCategories: ["Backend", "System design"],
    });
    expect(insights.map((item) => item.text)).toEqual([
      "3 follow-ups are due this week.",
      "You have 7 interview questions marked Need to Learn.",
      "You have not followed up with 2 recent networking contacts.",
      "You have 4 active applications.",
      "Backend and System design are currently your largest learning areas.",
    ]);
  });

  it("stays quiet when there is nothing to report", () => {
    expect(
      buildDashboardInsights({
        followUpsDueThisWeek: 0,
        needToLearn: 0,
        staleNetworking: 0,
        activeApplications: 0,
        topLearningCategories: [],
      }),
    ).toEqual([]);
  });
});

describe("week boundaries", () => {
  it("starts the week on Monday", () => {
    const friday = new Date(2026, 9, 9);
    expect(startOfWeek(friday).toISOString().slice(0, 10)).toBe("2026-10-05");
  });
});

describe("authentication", () => {
  it("rejects an incomplete login", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "" }).success).toBe(false);
  });

  it("hashes passwords and verifies them", async () => {
    const passwordHash = await hashPassword("CareerOS2026!");
    expect(passwordHash).not.toContain("CareerOS2026!");
    expect(await verifyPassword("CareerOS2026!", passwordHash)).toBe(true);
    expect(await verifyPassword("wrong-password", passwordHash)).toBe(false);
  });

  it("signs and verifies an access token", async () => {
    process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters";
    const token = await signAccessToken("64b7f3c2a1d4e5f678901234", "hussein@example.com");
    const session = await verifyAccessToken(token);
    expect(session).toEqual({
      userId: "64b7f3c2a1d4e5f678901234",
      email: "hussein@example.com",
    });
    expect(await verifyAccessToken(`${token}x`)).toBeNull();
  });
});
