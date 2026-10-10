"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { ErrorState, Skeleton, StatusBadge } from "@/components/ui/feedback";
import { api } from "@/lib/api";
import { formatDay, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/types";

const pipelineCards = (data: DashboardData) =>
  [
    ["Target companies", data.pipeline.targetCompanies, "/companies"],
    ["Qualified", data.pipeline.qualifiedCompanies, "/companies?status=qualified"],
    ["Conversations", data.pipeline.networkingConversations, "/networking"],
    ["Applications", data.pipeline.applications, "/applications"],
    ["Interviews", data.pipeline.interviews, "/interviews"],
    ["Offers", data.pipeline.offers, "/applications?status=offer"],
  ] as const;

export function DashboardPage() {
  const client = useQueryClient();
  const dashboard = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardData>("/api/dashboard"),
  });
  const complete = useMutation({
    mutationFn: (id: string) =>
      api(`/api/actions/${id}`, { method: "PATCH", body: JSON.stringify({ status: "done" }) }),
    onSuccess: async () => {
      toast.success("Action completed");
      await client.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (dashboard.isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-28 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (dashboard.isError || !dashboard.data) {
    return <ErrorState message="The dashboard could not be loaded." onRetry={() => dashboard.refetch()} />;
  }

  const data = dashboard.data;
  const cards = pipelineCards(data);

  return (
    <div className="space-y-10 pb-4">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-[2rem]">Dashboard</h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Where you are, what needs attention, and what to do next.
        </p>
      </header>

      {data.insights.length > 0 ? (
        <ul className="space-y-2" aria-label="Insights">
          {data.insights.map((insight) => (
            <li
              key={insight.text}
              className="rounded-xl border border-primary/15 bg-accent/50 px-4 py-3.5 text-base leading-relaxed text-foreground"
            >
              {insight.text}
            </li>
          ))}
        </ul>
      ) : null}

      <section aria-label="Direction">
        <SectionTitle>Direction</SectionTitle>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <DirectionCard label="Current target" value={data.direction.currentTargetRole} href="/career" />
          <DirectionCard label="4-year vision" value={data.direction.longTermTarget} href="/career" />
          <DirectionCard
            label="Search focus"
            value={data.direction.searchFocus || "Add a search focus on the Career page."}
            href="/career"
            subdued={!data.direction.searchFocus}
          />
        </div>
      </section>

      <section aria-label="Pipeline">
        <SectionTitle>Pipeline</SectionTitle>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {cards.map(([label, value, href]) => (
            <Link
              key={label}
              href={href}
              className="group rounded-xl border border-border bg-card px-4 py-4 transition-colors hover:border-primary/35 hover:bg-accent/30"
            >
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]" aria-label="Focus">
        <div className="min-w-0">
          <SectionTitle>Next actions</SectionTitle>
          {data.nextActions.length === 0 ? (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              No pending actions. Add one from a company, person, or application.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.nextActions.map((action) => (
                <li key={action.id}>
                  <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
                    <Link href={action.href} className="block min-w-0 group">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="text-base font-medium leading-snug break-words group-hover:text-primary sm:text-[1.05rem]">
                          {action.title}
                        </p>
                        <StatusBadge
                          value={action.source === "action" ? "pending" : "networking"}
                          label={action.related}
                        />
                      </div>
                      <p
                        className={cn(
                          "mt-2 text-sm",
                          isOverdue(action.dueDate) ? "font-medium text-destructive" : "text-muted-foreground",
                        )}
                      >
                        {action.dueDate
                          ? isOverdue(action.dueDate)
                            ? `Overdue · ${formatDay(action.dueDate)}`
                            : formatDay(action.dueDate)
                          : "No due date"}
                      </p>
                    </Link>
                    {action.source === "action" ? (
                      <button
                        type="button"
                        className="mt-3 text-sm font-medium text-primary underline-offset-4 hover:underline"
                        onClick={() => complete.mutate(action.id.replace(/^action-/, ""))}
                      >
                        Mark done
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-8">
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <SectionTitle as="h3">This week</SectionTitle>
            <dl className="mt-5 grid grid-cols-2 gap-4 sm:gap-5">
              <WeekMetric label="Applications" value={data.week.applications} />
              <WeekMetric label="Conversations" value={data.week.conversations} />
              <WeekMetric label="Interviews" value={data.week.interviews} />
              <WeekMetric label="Learning updates" value={data.week.learningUpdates} />
            </dl>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              {data.week.wins || "Add this week’s wins on the Progress page."}
            </p>
            <Link
              href="/progress"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Open weekly reflection
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>

          <section>
            <SectionTitle as="h3">Recent activity</SectionTitle>
            {data.activity.length === 0 ? (
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Activity will show up as you add companies, people, and interviews.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {data.activity.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="block rounded-xl border border-border bg-card px-4 py-4 transition-colors hover:border-primary/35 sm:px-5"
                    >
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{item.type}</p>
                      <p className="mt-1.5 text-base font-medium leading-snug">{item.title}</p>
                      {item.detail ? (
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ children, as = "h2" }: { children: ReactNode; as?: "h2" | "h3" }) {
  const Tag = as;
  return <Tag className="text-xl font-semibold tracking-tight sm:text-[1.35rem]">{children}</Tag>;
}

function DirectionCard({
  label,
  value,
  href,
  subdued = false,
}: {
  label: string;
  value: string;
  href: string;
  subdued?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[7.5rem] flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/35 hover:bg-accent/20"
    >
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-3 flex-1 text-base leading-relaxed",
          subdued ? "text-muted-foreground" : "font-semibold text-[1.05rem] leading-snug sm:text-lg",
        )}
      >
        {value}
      </p>
    </Link>
  );
}

function WeekMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</dd>
    </div>
  );
}
