"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useCompanyChoices, useDebounced, useListParams } from "@/features/shared";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialogs";
import { EmptyState, ErrorState, PageHeader, Pagination, Skeleton, StatusBadge } from "@/components/ui/feedback";
import { FormField, Input, Select, TextArea } from "@/components/ui/fields";
import {
  INTERVIEW_RESULT_LABELS,
  INTERVIEW_RESULTS,
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_TYPES,
  LEARNING_STATUS_LABELS,
  LEARNING_STATUSES,
  QUESTION_CATEGORIES,
  CATEGORY_LABELS,
} from "@/lib/constants";
import { api } from "@/lib/api";
import { formatDay, toDateInput } from "@/lib/format";
import type {
  Interview,
  InterviewQuestion,
  InterviewResult,
  InterviewType,
  LearningStatus,
  Page,
  QuestionCategory,
} from "@/types";

const empty = {
  companyId: "",
  applicationId: "",
  role: "",
  date: "",
  type: "technical" as InterviewType,
  interviewer: "",
  result: "pending" as InterviewResult,
  notes: "",
  wentWell: "",
  wentWrong: "",
  lessons: "",
  nextSteps: "",
};

export function InterviewsPage() {
  const { params, page, setParam, query } = useListParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const debounced = useDebounced(search);
  const companies = useCompanyChoices();
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
        description="A learning journal: what happened, what was hard, and what to practice next."
        action={<Button asChild><Link href="/interviews/new">Add interview</Link></Button>}
      />
      <div className="mb-4 grid gap-2 md:grid-cols-4">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search roles" aria-label="Search interviews" />
        <Select value={params.get("type") || ""} onChange={(event) => setParam("type", event.target.value)} aria-label="Interview type">
          <option value="">All types</option>
          {INTERVIEW_TYPES.map((type) => <option key={type} value={type}>{INTERVIEW_TYPE_LABELS[type]}</option>)}
        </Select>
        <Select value={params.get("result") || ""} onChange={(event) => setParam("result", event.target.value)} aria-label="Result">
          <option value="">All results</option>
          {INTERVIEW_RESULTS.map((result) => <option key={result} value={result}>{INTERVIEW_RESULT_LABELS[result]}</option>)}
        </Select>
        <Select value={params.get("companyId") || ""} onChange={(event) => setParam("companyId", event.target.value)} aria-label="Company">
          <option value="">All companies</option>
          {companies.data?.items.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
        </Select>
      </div>
      {interviews.isLoading ? <Skeleton className="h-48" /> : null}
      {interviews.isError ? <ErrorState message="Interviews could not be loaded." onRetry={() => interviews.refetch()} /> : null}
      {interviews.data && interviews.data.items.length === 0 ? (
        <EmptyState title="No interviews recorded yet." description="After an interview, write what happened while you still remember the questions." action={<Button asChild><Link href="/interviews/new">Add interview</Link></Button>} />
      ) : null}
      {interviews.data && interviews.data.items.length > 0 ? (
        <ul className="grid gap-3">
          {interviews.data.items.map((interview) => (
            <li key={interview.id}>
              <Link href={`/interviews/${interview.id}`} className="block rounded-lg border border-border bg-card p-4 hover:border-primary/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{interview.role}</p>
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
  const router = useRouter();
  const params = useSearchParams();
  const client = useQueryClient();
  const companies = useCompanyChoices();
  const [form, setForm] = useState({ ...empty, companyId: params.get("companyId") || "" });
  const applications = useQuery({
    queryKey: ["applications", "for-company", form.companyId],
    enabled: Boolean(form.companyId),
    queryFn: () => api<Page<import("@/types").Application>>(`/api/applications?companyId=${form.companyId}&limit=50`),
  });
  const existing = useQuery({
    queryKey: ["interview", id],
    enabled: mode === "edit" && Boolean(id),
    queryFn: () => api<{ interview: Interview }>(`/api/interviews/${id}`),
  });

  const [loadedInterview, setLoadedInterview] = useState(existing.data);
  if (existing.data && existing.data !== loadedInterview) {
    const interview = existing.data.interview;
    setLoadedInterview(existing.data);
    setForm({
      companyId: interview.company?.id || "",
      applicationId: interview.application?.id || "",
      role: interview.role,
      date: toDateInput(interview.date),
      type: interview.type,
      interviewer: interview.interviewer,
      result: interview.result,
      notes: interview.notes,
      wentWell: interview.wentWell,
      wentWrong: interview.wentWrong,
      lessons: interview.lessons,
      nextSteps: interview.nextSteps,
    });
  }

  const save = useMutation({
    mutationFn: () =>
      api<Interview>(mode === "create" ? "/api/interviews" : `/api/interviews/${id}`, {
        method: mode === "create" ? "POST" : "PUT",
        body: JSON.stringify(form),
      }),
    onSuccess: async (interview: Interview) => {
      toast.success(mode === "create" ? "Interview added" : "Interview updated");
      await client.invalidateQueries({ queryKey: ["interviews"] });
      await client.invalidateQueries({ queryKey: ["dashboard"] });
      router.push(`/interviews/${interview.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (mode === "edit" && existing.isLoading) return <Skeleton className="h-64" />;

  return (
    <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
      <PageHeader title={mode === "create" ? "Add interview" : "Edit interview"} description="Write the outcome while the details are still clear." />
      <div className="grid gap-4 rounded-lg border border-border bg-card p-5 md:grid-cols-2">
        <FormField label="Company" htmlFor="company"><Select id="company" required value={form.companyId} onChange={(event) => setForm({ ...form, companyId: event.target.value })}><option value="">Select a company</option>{companies.data?.items.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</Select></FormField>
        <FormField label="Role" htmlFor="role"><Input id="role" required value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} /></FormField>
        <FormField label="Application" htmlFor="application"><Select id="application" value={form.applicationId} onChange={(event) => setForm({ ...form, applicationId: event.target.value })}><option value="">No linked application</option>{applications.data?.items.map((item) => <option key={item.id} value={item.id}>{item.role}</option>)}</Select></FormField>
        <FormField label="Date" htmlFor="date"><Input id="date" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></FormField>
        <FormField label="Type" htmlFor="type"><Select id="type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as InterviewType })}>{INTERVIEW_TYPES.map((type) => <option key={type} value={type}>{INTERVIEW_TYPE_LABELS[type]}</option>)}</Select></FormField>
        <FormField label="Result" htmlFor="result"><Select id="result" value={form.result} onChange={(event) => setForm({ ...form, result: event.target.value as InterviewResult })}>{INTERVIEW_RESULTS.map((result) => <option key={result} value={result}>{INTERVIEW_RESULT_LABELS[result]}</option>)}</Select></FormField>
        <FormField label="Interviewer" htmlFor="interviewer"><Input id="interviewer" value={form.interviewer} onChange={(event) => setForm({ ...form, interviewer: event.target.value })} /></FormField>
        <div className="md:col-span-2"><FormField label="General notes" htmlFor="notes"><TextArea id="notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></FormField></div>
        <FormField label="What went well" htmlFor="well"><TextArea id="well" value={form.wentWell} onChange={(event) => setForm({ ...form, wentWell: event.target.value })} /></FormField>
        <FormField label="What went wrong" htmlFor="wrong"><TextArea id="wrong" value={form.wentWrong} onChange={(event) => setForm({ ...form, wentWrong: event.target.value })} /></FormField>
        <FormField label="Main lessons" htmlFor="lessons"><TextArea id="lessons" value={form.lessons} onChange={(event) => setForm({ ...form, lessons: event.target.value })} /></FormField>
        <FormField label="Next steps" htmlFor="next"><TextArea id="next" value={form.nextSteps} onChange={(event) => setForm({ ...form, nextSteps: event.target.value })} /></FormField>
      </div>
      <Button type="submit" loading={save.isPending} loadingLabel="Saving…">{mode === "create" ? "Add interview" : "Save changes"}</Button>
    </form>
  );
}

const emptyQuestion = {
  question: "",
  category: "general" as QuestionCategory,
  answerNotes: "",
  performance: "",
  improvement: "",
  learningStatus: "need_to_learn" as LearningStatus,
  relatedTopic: "",
};

export function InterviewDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [questionConfirm, setQuestionConfirm] = useState<string | null>(null);
  const [form, setForm] = useState(emptyQuestion);
  const detail = useQuery({
    queryKey: ["interview", id],
    queryFn: () => api<{ interview: Interview; questions: InterviewQuestion[] }>(`/api/interviews/${id}`),
  });

  const addQuestion = useMutation({
    mutationFn: () => api("/api/questions", { method: "POST", body: JSON.stringify({ ...form, interviewId: id }) }),
    onSuccess: async () => {
      toast.success("Question added");
      setForm(emptyQuestion);
      await client.invalidateQueries({ queryKey: ["interview", id] });
      await client.invalidateQueries({ queryKey: ["learning"] });
      await client.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setStatus = useMutation({
    mutationFn: ({ questionId, learningStatus }: { questionId: string; learningStatus: LearningStatus }) =>
      api(`/api/questions/${questionId}`, { method: "PATCH", body: JSON.stringify({ learningStatus }) }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["interview", id] });
      await client.invalidateQueries({ queryKey: ["learning"] });
      await client.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const track = useMutation({
    mutationFn: (question: InterviewQuestion) =>
      api("/api/learning", {
        method: "POST",
        body: JSON.stringify({
          title: question.question,
          category: question.category,
          status: question.learningStatus,
          notes: question.improvement,
          topic: question.relatedTopic,
          sourceQuestionId: question.id,
        }),
      }),
    onSuccess: async () => {
      toast.success("Added to learning");
      await client.invalidateQueries({ queryKey: ["learning"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeQuestion = useMutation({
    mutationFn: (questionId: string) => api(`/api/questions/${questionId}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Question deleted");
      setQuestionConfirm(null);
      await client.invalidateQueries({ queryKey: ["interview", id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: () => api(`/api/interviews/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Interview deleted");
      router.push("/interviews");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (detail.isLoading) return <Skeleton className="h-64" />;
  if (detail.isError || !detail.data) return <ErrorState message="This interview could not be loaded." onRetry={() => detail.refetch()} />;
  const { interview, questions } = detail.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={interview.role}
        description={`${interview.company?.name || "Interview"} · ${INTERVIEW_TYPE_LABELS[interview.type]} · ${formatDay(interview.date)}`}
        action={<div className="flex gap-2"><Button asChild variant="secondary"><Link href={`/interviews/${id}/edit`}>Edit</Link></Button><Button variant="ghost" onClick={() => setConfirm(true)}>Delete</Button></div>}
      />
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-5 text-sm"><h2 className="font-semibold">What went well</h2><p className="mt-2 whitespace-pre-wrap text-muted-foreground">{interview.wentWell || "Not written yet."}</p></article>
        <article className="rounded-lg border border-border bg-card p-5 text-sm"><h2 className="font-semibold">What went wrong</h2><p className="mt-2 whitespace-pre-wrap text-muted-foreground">{interview.wentWrong || "Not written yet."}</p></article>
        <article className="rounded-lg border border-border bg-card p-5 text-sm"><h2 className="font-semibold">Lessons</h2><p className="mt-2 whitespace-pre-wrap text-muted-foreground">{interview.lessons || "Not written yet."}</p></article>
        <article className="rounded-lg border border-border bg-card p-5 text-sm"><h2 className="font-semibold">Next steps</h2><p className="mt-2 whitespace-pre-wrap text-muted-foreground">{interview.nextSteps || interview.notes || "Not written yet."}</p></article>
      </section>

      <form className="space-y-4 rounded-lg border border-border bg-card p-5" onSubmit={(event) => { event.preventDefault(); addQuestion.mutate(); }}>
        <h2 className="text-lg font-semibold">Add a question</h2>
        <FormField label="Question" htmlFor="question"><TextArea id="question" required value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} /></FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Category" htmlFor="category"><Select id="category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as QuestionCategory })}>{QUESTION_CATEGORIES.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}</Select></FormField>
          <FormField label="Learning status" htmlFor="status"><Select id="status" value={form.learningStatus} onChange={(event) => setForm({ ...form, learningStatus: event.target.value as LearningStatus })}>{LEARNING_STATUSES.map((status) => <option key={status} value={status}>{LEARNING_STATUS_LABELS[status]}</option>)}</Select></FormField>
        </div>
        <FormField label="My answer / notes" htmlFor="answer"><TextArea id="answer" value={form.answerNotes} onChange={(event) => setForm({ ...form, answerNotes: event.target.value })} /></FormField>
        <FormField label="How I performed" htmlFor="performance"><TextArea id="performance" value={form.performance} onChange={(event) => setForm({ ...form, performance: event.target.value })} /></FormField>
        <FormField label="What I should improve" htmlFor="improvement"><TextArea id="improvement" value={form.improvement} onChange={(event) => setForm({ ...form, improvement: event.target.value })} /></FormField>
        <FormField label="Related topic" htmlFor="topic"><Input id="topic" value={form.relatedTopic} onChange={(event) => setForm({ ...form, relatedTopic: event.target.value })} /></FormField>
        <Button type="submit" loading={addQuestion.isPending} loadingLabel="Adding…">Add question</Button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Questions</h2>
        {questions.length === 0 ? <p className="text-sm text-muted-foreground">No questions yet. Add the ones you remember, especially the ones that felt shaky.</p> : null}
        {questions.map((question) => (
          <article key={question.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium">{question.question}</p>
                <p className="mt-1 text-xs text-muted-foreground">{CATEGORY_LABELS[question.category]}{question.relatedTopic ? ` · ${question.relatedTopic}` : ""}</p>
              </div>
              <Select aria-label="Learning status" className="sm:w-44" value={question.learningStatus} onChange={(event) => setStatus.mutate({ questionId: question.id, learningStatus: event.target.value as LearningStatus })}>
                {LEARNING_STATUSES.map((status) => <option key={status} value={status}>{LEARNING_STATUS_LABELS[status]}</option>)}
              </Select>
            </div>
            {question.performance ? <p className="mt-3 text-sm">Performance: {question.performance}</p> : null}
            {question.improvement ? <p className="mt-1 text-sm text-muted-foreground">Improve: {question.improvement}</p> : null}
            {question.answerNotes ? <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{question.answerNotes}</p> : null}
            <div className="mt-3 flex gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => track.mutate(question)}>Track as learning item</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setQuestionConfirm(question.id)}>Delete</Button>
            </div>
          </article>
        ))}
      </section>

      <ConfirmDialog open={confirm} title="Delete this interview?" description="The interview and its questions will be deleted. Learning items you created from them stay, without the question link." loading={remove.isPending} onOpenChange={setConfirm} onConfirm={() => remove.mutate()} />
      <ConfirmDialog open={Boolean(questionConfirm)} title="Delete this question?" description="The question will be removed from this interview." loading={removeQuestion.isPending} onOpenChange={(open) => { if (!open) setQuestionConfirm(null); }} onConfirm={() => questionConfirm && removeQuestion.mutate(questionConfirm)} />
    </div>
  );
}
