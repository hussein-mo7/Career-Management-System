export function parseDateInput(value?: string | null) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

export function startOfWeek(date = new Date()) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = local.getDay();
  const diff = day === 0 ? 6 : day - 1;
  local.setDate(local.getDate() - diff);
  return new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate()));
}

export function endOfWeek(weekStart: Date) {
  const end = new Date(weekStart);
  end.setUTCDate(end.getUTCDate() + 7);
  return end;
}

export type InsightInput = {
  followUpsDueThisWeek: number;
  staleNetworking: number;
  activeApplications: number;
};

export function buildDashboardInsights(input: InsightInput) {
  const insights: {
    tone: "priority" | "networking" | "applications";
    text: string;
  }[] = [];

  if (input.followUpsDueThisWeek > 0) {
    const noun = input.followUpsDueThisWeek === 1 ? "follow-up is" : "follow-ups are";
    insights.push({
      tone: "priority",
      text: `${input.followUpsDueThisWeek} ${noun} due this week.`,
    });
  }

  if (input.staleNetworking > 0) {
    const noun = input.staleNetworking === 1 ? "contact" : "contacts";
    insights.push({
      tone: "networking",
      text: `You have not followed up with ${input.staleNetworking} recent networking ${noun}.`,
    });
  }

  if (input.activeApplications > 0) {
    const noun = input.activeApplications === 1 ? "application" : "applications";
    insights.push({
      tone: "applications",
      text: `You have ${input.activeApplications} active ${noun}.`,
    });
  }

  return insights;
}
