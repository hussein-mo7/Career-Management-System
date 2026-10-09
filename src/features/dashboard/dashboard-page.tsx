"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ErrorState, PageHeader, Skeleton, StatusBadge } from "@/components/ui/feedback";
import { api } from "@/lib/api";
import { formatDay, isOverdue } from "@/lib/format";
import type { DashboardData } from "@/types";

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
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (dashboard.isError || !dashboard.data) {
    return <ErrorState message="The dashboard could not be loaded." onRetry={() => dashboard.refetch()} />;
  }

  const data = dashboard.data;
  const cards = [
    ["Target companies", data.pipeline.targetCompanies, "/companies"],
    ["Qualified", data.pipeline.qualifiedCompanies, "/companies?status=qualified"],
    ["Conversations", data.pipeline.networkingConversations, "/networking"],
    ["Applications", data.pipeline.applications, "/applications"],
    ["Interviews", data.pipeline.interviews, "/interviews"],
    ["Offers", data.pipeline.offers, "/applications?status=offer"],
  ] as const;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Where you are, what needs attention, and what to do next."
      />

      {data.insights.length > 0 ? (
        <ul className="mb-6 space-y-2">
          {data.insights.map((insight) => (
            <li key={insight.text} className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
              {insight.text}
            </li>
          ))}
        </ul>
      ) : null}

      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current target</p>
          <p className="mt-2 text-lg font-semibold">{data.direction.currentTargetRole}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">4-year vision</p>
          <p className="mt-2 text-lg font-semibold">{data.direction.longTermTarget}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Search focus</p>
          <p className="mt-2 text-sm leading-6">{data.direction.searchFocus || "Add a search focus on the Career page."}</p>
        </article>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Pipeline">
        {cards.map(([label, value, href]) => (
          <Link key={label} href={href} className="rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/40">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          </Link>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="text-lg font-semibold">Next actions</h2>
          {data.nextActions.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No pending actions. Add one from a company, person, or application.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.nextActions.map((action) => (
                <li key={action.id}>
                  <Link href={action.href} className="block rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/40">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">{action.title}</p>
                      <StatusBadge value={action.source === "action" ? "pending" : "networking"} label={action.related} />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className={`text-xs ${isOverdue(action.dueDate) ? "text-destructive" : "text-muted-foreground"}`}>
                        {action.dueDate ? (isOverdue(action.dueDate) ? `Overdue · ${formatDay(action.dueDate)}` : formatDay(action.dueDate)) : "No date"}
                      </p>
                      {action.source === "action" ? (
                        <button
                          type="button"
                          className="text-xs font-medium underline-offset-4 hover:underline"
                          onClick={(event) => {
                            event.preventDefault();
                            complete.mutate(action.id.replace(/^action-/, ""));
                          }}
                        >
                          Mark done
                        </button>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-lg font-semibold">This week</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Metric label="Applications" value={data.week.applications} />
              <Metric label="Conversations" value={data.week.conversations} />
              <Metric label="Interviews" value={data.week.interviews} />
              <Metric label="Learning updates" value={data.week.learningUpdates} />
            </dl>
            <p className="mt-4 text-sm text-muted-foreground">{data.week.wins || "Add this week’s wins on the Progress page."}</p>
            <Link href="/progress" className="mt-3 inline-block text-sm font-medium underline-offset-4 hover:underline">
              Open weekly reflection
            </Link>
          </section>
          <section>
            <h2 className="text-lg font-semibold">Recent activity</h2>
            {data.activity.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Activity will show up as you add companies, people, and interviews.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.activity.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} className="block rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/40">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.type}</p>
                      <p className="mt-1 font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.detail}</p>
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
