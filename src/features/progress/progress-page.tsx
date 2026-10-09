"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorState, PageHeader, Skeleton } from "@/components/ui/feedback";
import { FormField, TextArea } from "@/components/ui/fields";
import { api } from "@/lib/api";
import { formatDay, toDateInput } from "@/lib/format";
import type { WeeklyProgress } from "@/types";

type ProgressData = {
  metrics: Record<string, number>;
  currentWeek: WeeklyProgress;
  weeks: WeeklyProgress[];
};

const labels: Record<string, string> = {
  companiesResearched: "Companies researched",
  qualifiedCompanies: "Qualified companies",
  networkingConversations: "Networking conversations",
  coffeeChats: "Coffee chats",
  applications: "Applications",
  interviews: "Interviews",
  offers: "Offers",
  learningItems: "Learning items",
  masteredQuestions: "Mastered questions",
};

export function ProgressPage() {
  const client = useQueryClient();
  const progress = useQuery({ queryKey: ["progress"], queryFn: () => api<ProgressData>("/api/progress") });
  const [form, setForm] = useState({ weekStart: "", wins: "", lessons: "", focus: "" });
  const [loadedProgress, setLoadedProgress] = useState(progress.data);

  if (progress.data && progress.data !== loadedProgress) {
    const week = progress.data.currentWeek;
    setLoadedProgress(progress.data);
    setForm({ weekStart: toDateInput(week.weekStart), wins: week.wins, lessons: week.lessons, focus: week.focus });
  }

  const save = useMutation({
    mutationFn: () => api("/api/progress", { method: "PUT", body: JSON.stringify(form) }),
    onSuccess: async () => {
      toast.success("Weekly reflection saved");
      await client.invalidateQueries({ queryKey: ["progress"] });
      await client.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (progress.isLoading) return <Skeleton className="h-64" />;
  if (progress.isError || !progress.data) return <ErrorState message="Progress could not be loaded." onRetry={() => progress.refetch()} />;

  return (
    <div className="space-y-8">
      <PageHeader title="Progress" description="A simple view of movement. No vanity metrics." />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(progress.data.metrics).map(([key, value]) => (
          <article key={key} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{labels[key] || key}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          </article>
        ))}
      </section>
      <form className="space-y-4 rounded-lg border border-border bg-card p-5" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
        <h2 className="text-lg font-semibold">This week</h2>
        <p className="text-sm text-muted-foreground">Week of {formatDay(form.weekStart)}</p>
        <FormField label="This week's wins" htmlFor="wins"><TextArea id="wins" value={form.wins} onChange={(event) => setForm({ ...form, wins: event.target.value })} /></FormField>
        <FormField label="This week's lessons" htmlFor="lessons"><TextArea id="lessons" value={form.lessons} onChange={(event) => setForm({ ...form, lessons: event.target.value })} /></FormField>
        <FormField label="What I should focus on next week" htmlFor="focus"><TextArea id="focus" value={form.focus} onChange={(event) => setForm({ ...form, focus: event.target.value })} /></FormField>
        <Button type="submit" loading={save.isPending} loadingLabel="Saving…">Save reflection</Button>
      </form>
      {progress.data.weeks.length > 1 ? (
        <section>
          <h2 className="text-lg font-semibold">Earlier weeks</h2>
          <ul className="mt-3 space-y-3">
            {progress.data.weeks.filter((week) => toDateInput(week.weekStart) !== form.weekStart).map((week) => (
              <li key={week.id || week.weekStart} className="rounded-lg border border-border bg-card p-4 text-sm">
                <p className="font-medium">Week of {formatDay(week.weekStart)}</p>
                {week.wins ? <p className="mt-2">Wins: {week.wins}</p> : null}
                {week.lessons ? <p className="mt-1 text-muted-foreground">Lessons: {week.lessons}</p> : null}
                {week.focus ? <p className="mt-1">Next focus: {week.focus}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
