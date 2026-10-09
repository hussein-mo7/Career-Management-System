"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/dialogs";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, PageHeader, Skeleton, StatusBadge } from "@/components/ui/feedback";
import { FormField, Input, Select, TextArea } from "@/components/ui/fields";
import {
  CATEGORY_LABELS,
  CRITERION_CATEGORIES,
  CRITERION_PRIORITIES,
  PRIORITY_LABELS,
} from "@/lib/constants";
import { api } from "@/lib/api";
import type { Criterion, CriterionCategory, CriterionPriority } from "@/types";

const empty = {
  criterion: "",
  category: "growth" as CriterionCategory,
  priority: "high" as CriterionPriority,
  notes: "",
};

export function CriteriaPage() {
  const client = useQueryClient();
  const criteria = useQuery({ queryKey: ["criteria"], queryFn: () => api<Criterion[]>("/api/criteria") });
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<Criterion | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Criterion | null>(null);

  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ["criteria"] });
  };

  const create = useMutation({
    mutationFn: () => api("/api/criteria", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: async () => {
      toast.success("Criterion added");
      setForm(empty);
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: (value: Criterion) =>
      api(`/api/criteria/${value.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          criterion: value.criterion,
          category: value.category,
          priority: value.priority,
          notes: value.notes,
        }),
      }),
    onSuccess: async () => {
      toast.success("Criterion updated");
      setEditing(null);
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/criteria/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Criterion deleted");
      setPendingDelete(null);
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reorder = useMutation({
    mutationFn: (input: { priority: CriterionPriority; ids: string[] }) =>
      api("/api/criteria/reorder", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });

  if (criteria.isLoading) return <Skeleton className="h-80" />;
  if (criteria.isError || !criteria.data) {
    return <ErrorState message="Criteria could not be loaded." onRetry={() => criteria.refetch()} />;
  }

  function move(priority: CriterionPriority, index: number, direction: -1 | 1) {
    const group = criteria.data?.filter((item) => item.priority === priority) ?? [];
    const next = index + direction;
    if (next < 0 || next >= group.length) return;
    const ids = group.map((item) => item.id);
    const [moved] = ids.splice(index, 1);
    if (!moved) return;
    ids.splice(next, 0, moved);
    reorder.mutate({ priority, ids });
  }

  return (
    <div>
      <PageHeader
        title="Criteria"
        description="Define what a good company looks like before you get attached to a brand."
      />
      <form
        className="mb-8 grid gap-4 rounded-lg border border-border bg-card p-5 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
      >
        <FormField label="Criterion" htmlFor="criterion">
          <Input id="criterion" value={form.criterion} onChange={(event) => setForm({ ...form, criterion: event.target.value })} required />
        </FormField>
        <FormField label="Category" htmlFor="category">
          <Select id="category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as CriterionCategory })}>
            {CRITERION_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Priority" htmlFor="priority">
          <Select id="priority" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as CriterionPriority })}>
            {CRITERION_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Notes" htmlFor="notes">
          <Input id="notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        </FormField>
        <div className="md:col-span-2">
          <Button type="submit" loading={create.isPending} loadingLabel="Adding…">
            Add criterion
          </Button>
        </div>
      </form>

      {criteria.data.length === 0 ? (
        <EmptyState title="No criteria yet" description="Start with the things a company must have before it is worth your energy." />
      ) : (
        <div className="space-y-6">
          {CRITERION_PRIORITIES.map((priority) => {
            const group = criteria.data.filter((item) => item.priority === priority);
            if (group.length === 0) return null;
            return (
              <section key={priority}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {PRIORITY_LABELS[priority]}
                </h2>
                <ul className="space-y-2">
                  {group.map((item, index) => (
                    <li key={item.id} className="rounded-lg border border-border bg-card p-4">
                      {editing?.id === item.id ? (
                        <div className="grid gap-3">
                          <Input value={editing.criterion} onChange={(event) => setEditing({ ...editing, criterion: event.target.value })} aria-label="Criterion" />
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Select value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value as CriterionCategory })} aria-label="Category">
                              {CRITERION_CATEGORIES.map((category) => (
                                <option key={category} value={category}>
                                  {CATEGORY_LABELS[category]}
                                </option>
                              ))}
                            </Select>
                            <Select value={editing.priority} onChange={(event) => setEditing({ ...editing, priority: event.target.value as CriterionPriority })} aria-label="Priority">
                              {CRITERION_PRIORITIES.map((value) => (
                                <option key={value} value={value}>
                                  {PRIORITY_LABELS[value]}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <TextArea value={editing.notes} onChange={(event) => setEditing({ ...editing, notes: event.target.value })} aria-label="Notes" />
                          <div className="flex gap-2">
                            <Button type="button" loading={update.isPending} loadingLabel="Saving…" onClick={() => update.mutate(editing)}>
                              Save
                            </Button>
                            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-medium">{item.criterion}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <StatusBadge value={item.priority} label={PRIORITY_LABELS[item.priority]} />
                              <StatusBadge value="neutral" label={CATEGORY_LABELS[item.category] || item.category} />
                            </div>
                            {item.notes ? <p className="mt-2 text-sm text-muted-foreground">{item.notes}</p> : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="secondary" onClick={() => move(priority, index, -1)} disabled={index === 0} aria-label={`Move ${item.criterion} up`}>
                              Up
                            </Button>
                            <Button type="button" size="sm" variant="secondary" onClick={() => move(priority, index, 1)} disabled={index === group.length - 1} aria-label={`Move ${item.criterion} down`}>
                              Down
                            </Button>
                            <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(item)}>
                              Edit
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => setPendingDelete(item)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this criterion?"
        description="It will be removed from your list and from company evaluations. This cannot be undone."
        loading={remove.isPending}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        onConfirm={() => pendingDelete && remove.mutate(pendingDelete.id)}
      />
    </div>
  );
}
