"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, PageHeader, Skeleton, StatusBadge } from "@/components/ui/feedback";
import { FormField, Input, Select, TextArea } from "@/components/ui/fields";
import {
  CATEGORY_LABELS,
  LEARNING_CATEGORIES,
  LEARNING_STATUS_LABELS,
  LEARNING_STATUSES,
  SKILL_GROUP_LABELS,
  SKILL_STATUS_LABELS,
} from "@/lib/constants";
import { api } from "@/lib/api";
import type { InterviewQuestion, LearningCategory, LearningItem, LearningStatus, Skill } from "@/types";

type Board = { questions: InterviewQuestion[]; items: LearningItem[]; skills: Skill[] };

export function LearningPage() {
  const client = useQueryClient();
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", category: "general" as LearningCategory, status: "need_to_learn" as LearningStatus, notes: "", topic: "" });
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (category) params.set("category", category);
  if (search.trim()) params.set("q", search.trim());

  const board = useQuery({
    queryKey: ["learning", status, category, search],
    queryFn: () => api<Board>(`/api/learning?${params.toString()}`),
  });

  const create = useMutation({
    mutationFn: () => api("/api/learning", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: async () => {
      toast.success("Learning item added");
      setForm({ title: "", category: "general", status: "need_to_learn", notes: "", topic: "" });
      await client.invalidateQueries({ queryKey: ["learning"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateQuestion = useMutation({
    mutationFn: ({ id, learningStatus }: { id: string; learningStatus: LearningStatus }) =>
      api(`/api/questions/${id}`, { method: "PATCH", body: JSON.stringify({ learningStatus }) }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["learning"] });
      await client.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateItem = useMutation({
    mutationFn: (item: LearningItem) =>
      api(`/api/learning/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: item.title,
          category: item.category,
          status: item.status,
          notes: item.notes,
          topic: item.topic,
          sourceQuestionId: item.sourceQuestionId || "",
        }),
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["learning"] });
      await client.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateSkill = useMutation({
    mutationFn: (skill: Skill) => api("/api/career/skills", { method: "PATCH", body: JSON.stringify(skill) }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["learning"] });
      await client.invalidateQueries({ queryKey: ["career"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <PageHeader title="Learning" description="Turn interview mistakes and weak topics into something you can practice." />
      <div className="mb-4 grid gap-2 md:grid-cols-3">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search topics" aria-label="Search learning" />
        <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Learning status">
          <option value="">All statuses</option>
          {LEARNING_STATUSES.map((item) => <option key={item} value={item}>{LEARNING_STATUS_LABELS[item]}</option>)}
        </Select>
        <Select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {LEARNING_CATEGORIES.map((item) => <option key={item} value={item}>{CATEGORY_LABELS[item] || item}</option>)}
        </Select>
      </div>

      <form className="mb-8 grid gap-3 rounded-lg border border-border bg-card p-5 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}>
        <FormField label="Learning item" htmlFor="title"><Input id="title" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></FormField>
        <FormField label="Topic" htmlFor="topic"><Input id="topic" value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} /></FormField>
        <FormField label="Category" htmlFor="item-category"><Select id="item-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as LearningCategory })}>{LEARNING_CATEGORIES.map((item) => <option key={item} value={item}>{CATEGORY_LABELS[item] || item}</option>)}</Select></FormField>
        <FormField label="Status" htmlFor="item-status"><Select id="item-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as LearningStatus })}>{LEARNING_STATUSES.map((item) => <option key={item} value={item}>{LEARNING_STATUS_LABELS[item]}</option>)}</Select></FormField>
        <div className="md:col-span-2"><FormField label="Notes" htmlFor="notes"><TextArea id="notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></FormField></div>
        <Button type="submit" loading={create.isPending} loadingLabel="Adding…">Add learning item</Button>
      </form>

      {board.isLoading ? <Skeleton className="h-48" /> : null}
      {board.isError ? <ErrorState message="Learning items could not be loaded." onRetry={() => board.refetch()} /> : null}
      {board.data && board.data.questions.length === 0 && board.data.items.length === 0 ? (
        <EmptyState title="No learning items yet." description="Add a topic directly, or mark an interview question as Need to Learn." />
      ) : null}

      {LEARNING_STATUSES.map((group) => {
        const questions = board.data?.questions.filter((item) => item.learningStatus === group) ?? [];
        const items = board.data?.items.filter((item) => item.status === group) ?? [];
        if (questions.length + items.length === 0) return null;
        return (
          <section key={group} className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{LEARNING_STATUS_LABELS[group]}</h2>
            <ul className="space-y-2">
              {questions.map((question) => (
                <li key={question.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{question.question}</p>
                      <p className="text-xs text-muted-foreground">Interview question · {CATEGORY_LABELS[question.category]}</p>
                    </div>
                    <Select aria-label="Move question status" className="sm:w-44" value={question.learningStatus} onChange={(event) => updateQuestion.mutate({ id: question.id, learningStatus: event.target.value as LearningStatus })}>
                      {LEARNING_STATUSES.map((item) => <option key={item} value={item}>{LEARNING_STATUS_LABELS[item]}</option>)}
                    </Select>
                  </div>
                </li>
              ))}
              {items.map((item) => (
                <li key={item.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[item.category] || item.category}{item.topic ? ` · ${item.topic}` : ""}</p>
                    </div>
                    <Select aria-label="Move learning item status" className="sm:w-44" value={item.status} onChange={(event) => updateItem.mutate({ ...item, status: event.target.value as LearningStatus })}>
                      {LEARNING_STATUSES.map((statusItem) => <option key={statusItem} value={statusItem}>{LEARNING_STATUS_LABELS[statusItem]}</option>)}
                    </Select>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {board.data && board.data.skills.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Career skills</h2>
          <p className="mt-1 text-sm text-muted-foreground">These use a separate progress scale from interview questions.</p>
          <ul className="mt-3 grid gap-2">
            {board.data.skills.map((skill) => (
              <li key={`${skill.group}-${skill.name}`} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{skill.name}</p>
                  <StatusBadge value="neutral" label={SKILL_GROUP_LABELS[skill.group]} />
                </div>
                <Select aria-label={`${skill.name} progress`} className="sm:w-44" value={skill.status} onChange={(event) => updateSkill.mutate({ ...skill, status: event.target.value as Skill["status"] })}>
                  {Object.entries(SKILL_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
