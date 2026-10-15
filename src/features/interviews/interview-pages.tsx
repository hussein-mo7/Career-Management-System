"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useCompanyPrefill, useDebounced, useListParams } from "@/features/shared";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialogs";
import {
  backTargetFromParams,
  resolveBackLink,
  returnQueryFromSearchParams,
} from "@/features/navigation/return-nav";
import { DetailBackLink, EmptyState, ErrorState, PageHeader, Pagination, Skeleton, StatusBadge } from "@/components/ui/feedback";
import { FormField, Input, Select, TextArea } from "@/components/ui/fields";
import {
  INTERVIEW_RESULT_LABELS,
  INTERVIEW_RESULTS,
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_TYPES,
} from "@/lib/constants";
import { api } from "@/lib/api";
import { formatDay, toDateInput } from "@/lib/format";
import type { Interview, InterviewResult, InterviewType, Page } from "@/types";

type InterviewFormValues = {
  companyName: string;
  companyId: string;
  applicationId: string;
  role: string;
  date: string;
  type: InterviewType;
  result: InterviewResult;
  notes: string;
};

const emptyInterview: InterviewFormValues = {
  companyName: "",
  companyId: "",
  applicationId: "",
  role: "",
  date: "",
  type: "technical",
  result: "pending",
  notes: "",
};

function interviewToForm(interview: Interview): InterviewFormValues {
  return {
    companyName: interview.company?.name || "",
    companyId: interview.company?.id || "",
    applicationId: interview.application?.id || "",
    role: interview.role,
    date: toDateInput(interview.date),
    type: interview.type,
    result: interview.result,
    notes: interview.notes,
  };
}

export function InterviewsPage() {
  const { params, page, setParam, query } = useListParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const debounced = useDebounced(search);
  const interviews = useQuery({
    queryKey: ["interviews", query, debounced],
    queryFn: () => {
      const next = new URLSearchParams(query);
      if (debounced) next.set("q", debounced);
      else next.delete("q");
      return api<Page<Interview>>(`/api/interviews?${next.toString()}`);
    },
  });

  return (
    <div>
      <PageHeader
        title="Interviews"
        description="Track each interview and the note you want to keep."
        action={<Button asChild><Link href="/interviews/new">Add interview</Link></Button>}
      />
      <div className="mb-4 grid gap-2 md:grid-cols-3">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search role or company" aria-label="Search interviews" />
        <Select value={params.get("type") || ""} onChange={(event) => setParam("type", event.target.value)} aria-label="Interview stage">
          <option value="">All stages</option>
          {INTERVIEW_TYPES.map((type) => <option key={type} value={type}>{INTERVIEW_TYPE_LABELS[type]}</option>)}
        </Select>
        <Select value={params.get("result") || ""} onChange={(event) => setParam("result", event.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {INTERVIEW_RESULTS.map((result) => <option key={result} value={result}>{INTERVIEW_RESULT_LABELS[result]}</option>)}
        </Select>
      </div>
      {interviews.isLoading ? <Skeleton className="h-48" /> : null}
      {interviews.isError ? <ErrorState message="Interviews could not be loaded." onRetry={() => interviews.refetch()} /> : null}
      {interviews.data && interviews.data.items.length === 0 ? (
        <EmptyState title="No interviews recorded yet." description="Add the company, role, and date. A short note can wait until afterward." action={<Button asChild><Link href="/interviews/new">Add interview</Link></Button>} />
      ) : null}
      {interviews.data && interviews.data.items.length > 0 ? (
        <ul className="grid gap-3">
          {interviews.data.items.map((interview) => (
            <li key={interview.id}>
              <Link href={`/interviews/${interview.id}`} className="block rounded-lg border border-border bg-card p-4 hover:border-primary/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium break-words">{interview.role}</p>
                    <p className="text-sm text-muted-foreground">{interview.company?.name} · {INTERVIEW_TYPE_LABELS[interview.type]} · {formatDay(interview.date)}</p>
                  </div>
                  <StatusBadge value={interview.result} label={INTERVIEW_RESULT_LABELS[interview.result]} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {interviews.data ? <Pagination page={page} total={interviews.data.total} limit={interviews.data.limit} onPage={(next) => setParam("page", String(next))} /> : null}
    </div>
  );
}

export function InterviewEditor({ mode, id }: { mode: "create" | "edit"; id?: string }) {
  const params = useSearchParams();
  const companyIdParam = params.get("companyId") || "";
  const companyPrefill = useCompanyPrefill(companyIdParam);
  const existing = useQuery({
    queryKey: ["interview", id],
    enabled: mode === "edit" && Boolean(id),
    queryFn: () => api<{ interview: Interview }>(`/api/interviews/${id}`),
  });

  if (mode === "edit") {
    if (!id || existing.isLoading) return <Skeleton className="h-64" />;
    if (existing.isError || !existing.data) {
      return <ErrorState message="This interview could not be loaded." onRetry={() => existing.refetch()} />;
    }
    return (
      <InterviewEditorForm
        key={id}
        mode="edit"
        id={id}
        initial={interviewToForm(existing.data.interview)}
        returnQuery={returnQueryFromSearchParams(params)}
      />
    );
  }

  if (companyIdParam && companyPrefill.isLoading) return <Skeleton className="h-64" />;

  const initial: InterviewFormValues = {
    ...emptyInterview,
    companyId: companyIdParam,
    companyName: companyPrefill.data?.name || "",
  };

  return (
    <InterviewEditorForm
      key={`new-${companyIdParam}-${companyPrefill.data?.name || ""}`}
      mode="create"
      initial={initial}
      returnQuery={returnQueryFromSearchParams(params)}
    />
  );
}

function InterviewEditorForm({
  mode,
  id,
  initial,
  returnQuery = "",
}: {
  mode: "create" | "edit";
  id?: string;
  initial: InterviewFormValues;
  returnQuery?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const client = useQueryClient();
  const [form, setForm] = useState(initial);
  const companyBack = backTargetFromParams(searchParams);
  const companyPrefill = useCompanyPrefill(companyBack?.companyId ?? "");
  const back = resolveBackLink(
    searchParams,
    mode === "edit" && id
      ? { href: `/interviews/${id}${returnQuery}`, label: "Back to interview" }
      : { href: "/interviews", label: "Back to interviews" },
  );

  const save = useMutation({
    mutationFn: () =>
      api<Interview>(mode === "create" ? "/api/interviews" : `/api/interviews/${id}`, {
        method: mode === "create" ? "POST" : "PUT",
        body: JSON.stringify({
          ...form,
          companyId: form.companyId || undefined,
          applicationId: form.applicationId || undefined,
        }),
      }),
    onSuccess: async (interview: Interview) => {
      toast.success(mode === "create" ? "Interview added" : "Interview updated");
      await client.invalidateQueries({ queryKey: ["interviews"] });
      await client.invalidateQueries({ queryKey: ["dashboard"] });
      router.push(`/interviews/${interview.id}${returnQueryFromSearchParams(searchParams)}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
      <DetailBackLink
        href={back.href}
        label={
          companyBack && companyPrefill.data?.name ? `Back to ${companyPrefill.data.name}` : back.label
        }
      />
      <PageHeader title={mode === "create" ? "Add interview" : "Edit interview"} description="Company, role, and when it happened. Notes can stay blank until you are ready." />
      <div className="grid gap-4 rounded-lg border border-border bg-card p-5 md:grid-cols-2">
        <FormField label="Company" htmlFor="company">
          <Input
            id="company"
            required
            value={form.companyName}
            onChange={(event) => {
              const companyName = event.target.value;
              const sameCompany = companyName.trim().toLowerCase() === initial.companyName.trim().toLowerCase();
              setForm({
                ...form,
                companyName,
                companyId: sameCompany ? initial.companyId : "",
                applicationId: sameCompany ? initial.applicationId : "",
              });
            }}
            placeholder="Company name"
          />
        </FormField>
        <FormField label="Role" htmlFor="role">
          <Input id="role" required value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} />
        </FormField>
        <FormField label="Interview date" htmlFor="date">
          <Input id="date" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
        </FormField>
        <FormField label="Interview stage" htmlFor="type">
          <Select id="type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as InterviewType })}>
            {INTERVIEW_TYPES.map((type) => <option key={type} value={type}>{INTERVIEW_TYPE_LABELS[type]}</option>)}
          </Select>
        </FormField>
        <FormField label="Status" htmlFor="result">
          <Select id="result" value={form.result} onChange={(event) => setForm({ ...form, result: event.target.value as InterviewResult })}>
            {INTERVIEW_RESULTS.map((result) => <option key={result} value={result}>{INTERVIEW_RESULT_LABELS[result]}</option>)}
          </Select>
        </FormField>
        <div className="md:col-span-2">
          <FormField label="Notes" htmlFor="notes">
            <TextArea
              id="notes"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="What happened, what went well, what was hard, and what to practice next."
            />
          </FormField>
        </div>
      </div>
      <Button type="submit" loading={save.isPending} loadingLabel="Saving…">{mode === "create" ? "Add interview" : "Save changes"}</Button>
    </form>
  );
}

export function InterviewDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const client = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const returnQuery = returnQueryFromSearchParams(searchParams);
  const companyBack = backTargetFromParams(searchParams);
  const companyPrefill = useCompanyPrefill(companyBack?.companyId ?? "");
  const back = resolveBackLink(searchParams, { href: "/interviews", label: "Back to interviews" });
  const detail = useQuery({
    queryKey: ["interview", id],
    queryFn: () => api<{ interview: Interview }>(`/api/interviews/${id}`),
  });

  const remove = useMutation({
    mutationFn: () => api(`/api/interviews/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Interview deleted");
      await client.invalidateQueries({ queryKey: ["interviews"] });
      router.push(back.href);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (detail.isLoading) return <Skeleton className="h-64" />;
  if (detail.isError || !detail.data) return <ErrorState message="This interview could not be loaded." onRetry={() => detail.refetch()} />;
  const { interview } = detail.data;

  return (
    <div className="space-y-6">
      <DetailBackLink
        href={back.href}
        label={
          companyBack && companyPrefill.data?.name ? `Back to ${companyPrefill.data.name}` : back.label
        }
      />
      <PageHeader
        title={interview.role}
        description={interview.company?.name || "Interview"}
        action={
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link href={`/interviews/${id}/edit${returnQuery}`}>Edit</Link>
            </Button>
            <Button variant="ghost" onClick={() => setConfirm(true)}>
              Delete
            </Button>
          </div>
        }
      />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Company" value={interview.company?.name || "—"} />
        <Fact label="Role" value={interview.role} />
        <Fact label="Interview date" value={formatDay(interview.date)} />
        <Fact label="Interview stage" value={INTERVIEW_TYPE_LABELS[interview.type]} />
        <Fact label="Status" value={INTERVIEW_RESULT_LABELS[interview.result]} />
      </section>
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">Notes</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{interview.notes || "No notes added yet."}</p>
      </section>
      <ConfirmDialog open={confirm} title="Delete this interview?" description="This interview will be deleted." loading={remove.isPending} onOpenChange={setConfirm} onConfirm={() => remove.mutate()} />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
