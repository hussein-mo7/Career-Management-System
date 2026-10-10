"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { useCompanyChoices, useDebounced, useListParams } from "@/features/shared";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialogs";
import { EmptyState, ErrorState, PageHeader, Pagination, Skeleton } from "@/components/ui/feedback";
import { FormField, Input, Select, TextArea } from "@/components/ui/fields";
import { INTERACTION_LABELS, INTERACTION_TYPES } from "@/lib/constants";
import { api } from "@/lib/api";
import { formatDay } from "@/lib/format";
import type { Interaction, InteractionType, Page, Person } from "@/types";

type PersonFormValues = {
  name: string;
  role: string;
  companyName: string;
  companyId: string;
  notes: string;
};

const emptyPerson: PersonFormValues = {
  name: "",
  role: "",
  companyName: "",
  companyId: "",
  notes: "",
};

function personToForm(person: Person): PersonFormValues {
  return {
    name: person.name,
    role: person.role,
    companyName: person.company?.name || "",
    companyId: person.company?.id || "",
    notes: person.notes,
  };
}

function personPayload(form: PersonFormValues) {
  return {
    ...form,
    linkedin: "",
    howWeMet: "",
    relationshipType: "other",
  };
}

export function NetworkingPage() {
  const { params, page, setParam, query } = useListParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const debounced = useDebounced(search);
  const people = useQuery({
    queryKey: ["people", query, debounced],
    queryFn: () => {
      const next = new URLSearchParams(query);
      if (debounced) next.set("q", debounced);
      else next.delete("q");
      return api<Page<Person>>(`/api/people?${next.toString()}`);
    },
  });

  return (
    <div>
      <PageHeader
        title="Networking"
        description="People you met and what you want to remember about them."
        action={
          <Button asChild>
            <Link href="/networking/new">Add a person</Link>
          </Button>
        }
      />
      <div className="mb-4">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people" aria-label="Search people" />
      </div>
      {people.isLoading ? <Skeleton className="h-48" /> : null}
      {people.isError ? <ErrorState message="People could not be loaded." onRetry={() => people.refetch()} /> : null}
      {people.data && people.data.items.length === 0 ? (
        <EmptyState
          title="No people yet."
          description="Add a name, company, and a short note. That is enough to start."
          action={
            <Button asChild>
              <Link href="/networking/new">Add a person</Link>
            </Button>
          }
        />
      ) : null}
      {people.data && people.data.items.length > 0 ? (
        <ul className="grid gap-3">
          {people.data.items.map((person) => (
            <li key={person.id}>
              <Link href={`/networking/${person.id}`} className="block rounded-lg border border-border bg-card p-4 hover:border-primary/40">
                <p className="font-medium break-words">{person.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[person.role, person.company?.name].filter(Boolean).join(" · ") || "No company yet"}
                </p>
                {person.notes ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{person.notes}</p> : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {people.data ? (
        <Pagination page={page} total={people.data.total} limit={people.data.limit} onPage={(next) => setParam("page", String(next))} />
      ) : null}
    </div>
  );
}

export function PersonEditor({ mode, id }: { mode: "create" | "edit"; id?: string }) {
  const params = useSearchParams();
  const companyIdParam = params.get("companyId") || "";
  const companies = useCompanyChoices();
  const existing = useQuery({
    queryKey: ["person", id],
    enabled: mode === "edit" && Boolean(id),
    queryFn: () => api<{ person: Person }>(`/api/people/${id}`),
  });

  if (mode === "edit") {
    if (!id || existing.isLoading) return <Skeleton className="h-64" />;
    if (existing.isError || !existing.data) {
      return <ErrorState message="This person could not be loaded." onRetry={() => existing.refetch()} />;
    }
    return <PersonEditorForm key={id} mode="edit" id={id} initial={personToForm(existing.data.person)} />;
  }

  if (companyIdParam && companies.isLoading) return <Skeleton className="h-64" />;

  let initial = { ...emptyPerson, companyId: companyIdParam };
  if (companyIdParam && companies.data) {
    const company = companies.data.items.find((item) => item.id === companyIdParam);
    if (company) initial = { ...initial, companyName: company.name };
  }

  return <PersonEditorForm key={`new-${companyIdParam}`} mode="create" initial={initial} />;
}

function PersonEditorForm({
  mode,
  id,
  initial,
}: {
  mode: "create" | "edit";
  id?: string;
  initial: PersonFormValues;
}) {
  const router = useRouter();
  const client = useQueryClient();
  const [form, setForm] = useState(initial);

  const save = useMutation({
    mutationFn: () =>
      api<Person>(mode === "create" ? "/api/people" : `/api/people/${id}`, {
        method: mode === "create" ? "POST" : "PUT",
        body: JSON.stringify(personPayload(form)),
      }),
    onSuccess: async (person: Person) => {
      toast.success(mode === "create" ? "Person added" : "Person updated");
      await client.invalidateQueries({ queryKey: ["people"] });
      await client.invalidateQueries({ queryKey: ["person", person.id] });
      router.push(`/networking/${person.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <PageHeader
        title={mode === "create" ? "Add a person" : "Edit person"}
        description="Name, role, company, and one note. Keep it light."
      />
      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <FormField label="Name" htmlFor="name">
          <Input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </FormField>
        <FormField label="Role" htmlFor="role">
          <Input id="role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} placeholder="Engineer, recruiter, mentor…" />
        </FormField>
        <FormField label="Company" htmlFor="company">
          <Input
            id="company"
            value={form.companyName}
            onChange={(event) => setForm({ ...form, companyName: event.target.value, companyId: "" })}
            placeholder="Company name"
          />
        </FormField>
        <FormField label="Notes" htmlFor="notes">
          <TextArea id="notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="How you met, what to follow up on, anything worth remembering." />
        </FormField>
      </div>
      <Button type="submit" loading={save.isPending} loadingLabel="Saving…">
        {mode === "create" ? "Add person" : "Save changes"}
      </Button>
    </form>
  );
}

export function PersonDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const detail = useQuery({
    queryKey: ["person", id],
    queryFn: () => api<{ person: Person; interactions: Interaction[] }>(`/api/people/${id}`),
  });
  const [confirm, setConfirm] = useState(false);
  const [conversation, setConversation] = useState({ date: "", type: "coffee_chat" as InteractionType, notes: "" });

  const create = useMutation({
    mutationFn: () =>
      api("/api/interactions", {
        method: "POST",
        body: JSON.stringify({
          personId: id,
          date: conversation.date,
          type: conversation.type,
          notes: conversation.notes,
          learned: "",
          improve: "",
          nextStep: "",
          rating: null,
          reflection: {},
          createAction: false,
        }),
      }),
    onSuccess: async () => {
      toast.success("Conversation saved");
      setConversation({ date: "", type: "coffee_chat", notes: "" });
      await client.invalidateQueries({ queryKey: ["person", id] });
      await client.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeInteraction = useMutation({
    mutationFn: (interactionId: string) => api(`/api/interactions/${interactionId}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Conversation deleted");
      await client.invalidateQueries({ queryKey: ["person", id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: () => api(`/api/people/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Person deleted");
      router.push("/networking");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (detail.isLoading) return <Skeleton className="h-64" />;
  if (detail.isError || !detail.data) return <ErrorState message="This person could not be loaded." onRetry={() => detail.refetch()} />;
  const { person, interactions } = detail.data;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    create.mutate();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={person.name}
        description={[person.role, person.company?.name].filter(Boolean).join(" · ") || "Contact"}
        action={
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link href={`/networking/${id}/edit`}>Edit</Link>
            </Button>
            <Button variant="ghost" onClick={() => setConfirm(true)}>
              Delete
            </Button>
          </div>
        }
      />

      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <dl className="mt-4 space-y-3 text-base">
          <div>
            <dt className="text-sm text-muted-foreground">Role</dt>
            <dd className="mt-0.5">{person.role || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Company</dt>
            <dd className="mt-0.5">{person.company?.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Notes</dt>
            <dd className="mt-0.5 whitespace-pre-wrap leading-relaxed text-muted-foreground">{person.notes || "No notes yet."}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Add a conversation note</h2>
        <p className="mt-1 text-sm text-muted-foreground">Date, type, and a short note. Nothing else required.</p>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Date" htmlFor="date">
              <Input id="date" type="date" value={conversation.date} onChange={(event) => setConversation({ ...conversation, date: event.target.value })} />
            </FormField>
            <FormField label="Type" htmlFor="type">
              <Select id="type" value={conversation.type} onChange={(event) => setConversation({ ...conversation, type: event.target.value as InteractionType })}>
                {INTERACTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {INTERACTION_LABELS[type]}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <FormField label="Note" htmlFor="conversation-notes">
            <TextArea
              id="conversation-notes"
              value={conversation.notes}
              onChange={(event) => setConversation({ ...conversation, notes: event.target.value })}
              placeholder="What happened and what you want to remember."
            />
          </FormField>
          <Button type="submit" loading={create.isPending} loadingLabel="Saving…">
            Save note
          </Button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Past conversations</h2>
        {interactions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No conversation notes yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {interactions.map((interaction) => (
              <li key={interaction.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {INTERACTION_LABELS[interaction.type]} · {formatDay(interaction.date)}
                    </p>
                    {interaction.notes ? <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{interaction.notes}</p> : null}
                  </div>
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeInteraction.mutate(interaction.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={confirm}
        title={`Delete ${person.name}?`}
        description="This deletes the person, their conversations, and actions linked only to them."
        loading={remove.isPending}
        onOpenChange={setConfirm}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}
