"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { useCompanyChoices, useDebounced, useListParams } from "@/features/shared";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/controls";
import { ConfirmDialog } from "@/components/ui/dialogs";
import { EmptyState, ErrorState, PageHeader, Pagination, Skeleton, StatusBadge } from "@/components/ui/feedback";
import { FormField, Input, Select, TextArea } from "@/components/ui/fields";
import {
  INTERACTION_LABELS,
  INTERACTION_TYPES,
  REFLECTION_FIELDS,
  RELATIONSHIP_LABELS,
  RELATIONSHIP_TYPES,
} from "@/lib/constants";
import { api } from "@/lib/api";
import { formatDay } from "@/lib/format";
import type { Interaction, InteractionType, Page, Person, Reflection, RelationshipType } from "@/types";

const emptyPerson = {
  name: "",
  role: "",
  companyId: "",
  linkedin: "",
  howWeMet: "",
  relationshipType: "other" as RelationshipType,
  notes: "",
};

const emptyReflection = {
  introClear: false,
  journeyNatural: false,
  toldStory: false,
  letThemTalk: false,
  genuineInterest: false,
  followUpQuestions: false,
  feltNatural: false,
  comfortableAtmosphere: false,
  usefulQuestions: false,
};

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
        description="Remember who you met, what happened, and what you should do next."
        action={
          <Button asChild>
            <Link href="/networking/new">Add a person</Link>
          </Button>
        }
      />
      <div className="mb-4 grid gap-2 md:grid-cols-2">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people" aria-label="Search people" />
        <Select value={params.get("relationship") || ""} onChange={(event) => setParam("relationship", event.target.value)} aria-label="Relationship">
          <option value="">All relationships</option>
          {RELATIONSHIP_TYPES.map((type) => (
            <option key={type} value={type}>
              {RELATIONSHIP_LABELS[type]}
            </option>
          ))}
        </Select>
      </div>
      {people.isLoading ? <Skeleton className="h-48" /> : null}
      {people.isError ? <ErrorState message="People could not be loaded." onRetry={() => people.refetch()} /> : null}
      {people.data && people.data.items.length === 0 ? (
        <EmptyState
          title="No conversations recorded yet."
          description="A name, how you met, and one next step is enough to start."
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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{person.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {[person.role, person.company?.name].filter(Boolean).join(" · ") || "Independent contact"}
                    </p>
                  </div>
                  <StatusBadge value="networking" label={RELATIONSHIP_LABELS[person.relationshipType]} />
                </div>
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
  const router = useRouter();
  const params = useSearchParams();
  const client = useQueryClient();
  const companies = useCompanyChoices();
  const existing = useQuery({
    queryKey: ["person", id],
    enabled: mode === "edit" && Boolean(id),
    queryFn: () => api<{ person: Person }>(`/api/people/${id}`),
  });
  const [form, setForm] = useState({ ...emptyPerson, companyId: params.get("companyId") || "" });

  const [loadedPerson, setLoadedPerson] = useState(existing.data);
  if (existing.data && existing.data !== loadedPerson) {
    const person = existing.data.person;
    setLoadedPerson(existing.data);
    setForm({
      name: person.name,
      role: person.role,
      companyId: person.company?.id || "",
      linkedin: person.linkedin,
      howWeMet: person.howWeMet,
      relationshipType: person.relationshipType,
      notes: person.notes,
    });
  }

  const save = useMutation({
    mutationFn: () =>
      api<Person>(mode === "create" ? "/api/people" : `/api/people/${id}`, {
        method: mode === "create" ? "POST" : "PUT",
        body: JSON.stringify(form),
      }),
    onSuccess: async (person: Person) => {
      toast.success(mode === "create" ? "Person added" : "Person updated");
      await client.invalidateQueries({ queryKey: ["people"] });
      router.push(`/networking/${person.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (mode === "edit" && existing.isLoading) return <Skeleton className="h-64" />;

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <PageHeader title={mode === "create" ? "Add a person" : "Edit person"} description="Keep this short. The conversation notes matter more than the profile." />
      <div className="grid gap-4 rounded-lg border border-border bg-card p-5 md:grid-cols-2">
        <FormField label="Name" htmlFor="name">
          <Input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </FormField>
        <FormField label="Role" htmlFor="role">
          <Input id="role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} />
        </FormField>
        <FormField label="Company" htmlFor="company">
          <Select id="company" value={form.companyId} onChange={(event) => setForm({ ...form, companyId: event.target.value })}>
            <option value="">No company</option>
            {companies.data?.items.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Relationship" htmlFor="relationship">
          <Select id="relationship" value={form.relationshipType} onChange={(event) => setForm({ ...form, relationshipType: event.target.value as RelationshipType })}>
            {RELATIONSHIP_TYPES.map((type) => (
              <option key={type} value={type}>
                {RELATIONSHIP_LABELS[type]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="LinkedIn" htmlFor="linkedin">
          <Input id="linkedin" value={form.linkedin} onChange={(event) => setForm({ ...form, linkedin: event.target.value })} placeholder="https://" />
        </FormField>
        <FormField label="How we met" htmlFor="met">
          <Input id="met" value={form.howWeMet} onChange={(event) => setForm({ ...form, howWeMet: event.target.value })} />
        </FormField>
        <div className="md:col-span-2">
          <FormField label="Notes" htmlFor="notes">
            <TextArea id="notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </FormField>
        </div>
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
  const [form, setForm] = useState({
    date: "",
    type: "coffee_chat" as InteractionType,
    notes: "",
    learned: "",
    improve: "",
    nextStep: "",
    rating: null as number | null,
    reflection: emptyReflection,
    createAction: true,
  });

  const create = useMutation({
    mutationFn: () =>
      api("/api/interactions", {
        method: "POST",
        body: JSON.stringify({ ...form, personId: id }),
      }),
    onSuccess: async () => {
      toast.success("Conversation saved");
      setForm({
        date: "",
        type: "coffee_chat",
        notes: "",
        learned: "",
        improve: "",
        nextStep: "",
        rating: null,
        reflection: emptyReflection,
        createAction: true,
      });
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
    <div className="space-y-6">
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
      <section className="rounded-lg border border-border bg-card p-5 text-sm">
        <p>{RELATIONSHIP_LABELS[person.relationshipType]}</p>
        {person.howWeMet ? <p className="mt-2 text-muted-foreground">Met through {person.howWeMet}</p> : null}
        {person.linkedin ? (
          <a className="mt-2 inline-block font-medium underline-offset-4 hover:underline" href={person.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        ) : null}
        {person.notes ? <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{person.notes}</p> : null}
      </section>

      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Record a conversation</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Date" htmlFor="date">
            <Input id="date" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </FormField>
          <FormField label="Type" htmlFor="type">
            <Select id="type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as InteractionType })}>
              {INTERACTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {INTERACTION_LABELS[type]}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField label="Notes" htmlFor="notes">
          <TextArea id="notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        </FormField>
        <FormField label="What I learned" htmlFor="learned">
          <TextArea id="learned" value={form.learned} onChange={(event) => setForm({ ...form, learned: event.target.value })} />
        </FormField>
        <FormField label="What I should improve" htmlFor="improve">
          <TextArea id="improve" value={form.improve} onChange={(event) => setForm({ ...form, improve: event.target.value })} />
        </FormField>
        <FormField label="Next step" htmlFor="next">
          <Input id="next" value={form.nextStep} onChange={(event) => setForm({ ...form, nextStep: event.target.value })} />
        </FormField>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.createAction} onChange={(event) => setForm({ ...form, createAction: event.target.checked })} />
          Add this next step to my actions
        </label>
        <Rating value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
        <fieldset>
          <legend className="text-sm font-medium">Optional reflection</legend>
          <p className="mt-1 text-xs text-muted-foreground">Check what went well. Leave the rest blank.</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {REFLECTION_FIELDS.map((field) => (
              <label key={field.key} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={form.reflection[field.key]}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      reflection: { ...form.reflection, [field.key]: event.target.checked },
                    })
                  }
                />
                <span>
                  <span className="block text-xs text-muted-foreground">{field.group}</span>
                  {field.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <Button type="submit" loading={create.isPending} loadingLabel="Saving…">
          Save conversation
        </Button>
      </form>

      <section>
        <h2 className="text-lg font-semibold">Conversations</h2>
        {interactions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No conversations yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {interactions.map((interaction) => (
              <li key={interaction.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {INTERACTION_LABELS[interaction.type]} · {formatDay(interaction.date)}
                    </p>
                    {interaction.notes ? <p className="mt-2 whitespace-pre-wrap text-sm">{interaction.notes}</p> : null}
                    {interaction.learned ? <p className="mt-2 text-sm text-muted-foreground">Learned: {interaction.learned}</p> : null}
                    {interaction.improve ? <p className="mt-1 text-sm text-muted-foreground">Improve: {interaction.improve}</p> : null}
                    {interaction.nextStep ? <p className="mt-1 text-sm">Next: {interaction.nextStep}</p> : null}
                    <ReflectionSummary reflection={interaction.reflection} />
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

function ReflectionSummary({ reflection }: { reflection: Reflection }) {
  const checked = REFLECTION_FIELDS.filter((field) => reflection[field.key]);
  if (checked.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {checked.map((field) => (
        <li key={field.key} className="rounded-md bg-secondary px-2 py-1 text-xs">
          {field.label}
        </li>
      ))}
    </ul>
  );
}
