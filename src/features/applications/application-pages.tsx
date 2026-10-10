"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useCompanyPrefill, useDebounced, useListParams, usePersonChoices } from "@/features/shared";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialogs";
import { EmptyState, ErrorState, PageHeader, Pagination, Skeleton, StatusBadge } from "@/components/ui/feedback";
import { FormField, Input, Select, TextArea } from "@/components/ui/fields";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS } from "@/lib/constants";
import { api } from "@/lib/api";
import { formatDay, toDateInput } from "@/lib/format";
import type { Application, ApplicationStatus, Page } from "@/types";

type ApplicationFormValues = {
  companyName: string;
  companyId: string;
  role: string;
  jobUrl: string;
  dateApplied: string;
  status: ApplicationStatus;
  cvVersion: string;
  coverLetterNotes: string;
  contactId: string;
  notes: string;
  nextAction: string;
  followUpDate: string;
};

const emptyApplication: ApplicationFormValues = {
  companyName: "",
  companyId: "",
  role: "",
  jobUrl: "",
  dateApplied: "",
  status: "saved",
  cvVersion: "",
  coverLetterNotes: "",
  contactId: "",
  notes: "",
  nextAction: "",
  followUpDate: "",
};

function applicationToForm(item: Application): ApplicationFormValues {
  return {
    companyName: item.company?.name || "",
    companyId: item.company?.id || "",
    role: item.role,
    jobUrl: item.jobUrl,
    dateApplied: toDateInput(item.dateApplied),
    status: item.status,
    cvVersion: item.cvVersion,
    coverLetterNotes: item.coverLetterNotes,
    contactId: item.contact?.id || "",
    notes: item.notes,
    nextAction: item.nextAction,
    followUpDate: toDateInput(item.followUpDate),
  };
}

export function ApplicationsPage() {
  const { params, page, setParam, query } = useListParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const debounced = useDebounced(search);
  const applications = useQuery({
    queryKey: ["applications", query, debounced],
    queryFn: () => {
      const next = new URLSearchParams(query);
      if (debounced) next.set("q", debounced);
      else next.delete("q");
      return api<Page<Application>>(`/api/applications?${next.toString()}`);
    },
  });

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Track what you sent, where it stands, and when to follow up."
        action={
          <Button asChild>
            <Link href="/applications/new">Add application</Link>
          </Button>
        }
      />
      <div className="mb-4 grid gap-2 md:grid-cols-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search role or company"
          aria-label="Search applications"
        />
        <Select value={params.get("status") || ""} onChange={(event) => setParam("status", event.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {APPLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {APPLICATION_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </div>
      {applications.isLoading ? <Skeleton className="h-48" /> : null}
      {applications.isError ? <ErrorState message="Applications could not be loaded." onRetry={() => applications.refetch()} /> : null}
      {applications.data && applications.data.items.length === 0 ? (
        <EmptyState title="No applications yet." description="Save a role when it is worth pursuing, then track the follow-up." action={<Button asChild><Link href="/applications/new">Add application</Link></Button>} />
      ) : null}
      {applications.data && applications.data.items.length > 0 ? (
        <ul className="grid gap-3">
          {applications.data.items.map((application) => (
            <li key={application.id}>
              <Link href={`/applications/${application.id}`} className="block rounded-lg border border-border bg-card p-4 hover:border-primary/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium break-words">{application.role}</p>
                    <p className="text-sm text-muted-foreground">{application.company?.name || "Company"} · {formatDay(application.dateApplied)}</p>
                  </div>
                  <StatusBadge value={application.status} label={APPLICATION_STATUS_LABELS[application.status]} />
                </div>
                {application.nextAction ? <p className="mt-2 text-sm">Next: {application.nextAction}</p> : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {applications.data ? <Pagination page={page} total={applications.data.total} limit={applications.data.limit} onPage={(next) => setParam("page", String(next))} /> : null}
    </div>
  );
}

export function ApplicationEditor({ mode, id }: { mode: "create" | "edit"; id?: string }) {
  const params = useSearchParams();
  const companyIdParam = params.get("companyId") || "";
  const companyPrefill = useCompanyPrefill(companyIdParam);
  const existing = useQuery({
    queryKey: ["application", id],
    enabled: mode === "edit" && Boolean(id),
    queryFn: () => api<Application>(`/api/applications/${id}`),
  });

  if (mode === "edit") {
    if (!id || existing.isLoading) return <Skeleton className="h-64" />;
    if (existing.isError || !existing.data) {
      return <ErrorState message="This application could not be loaded." onRetry={() => existing.refetch()} />;
    }
    return <ApplicationEditorForm key={id} mode="edit" id={id} initial={applicationToForm(existing.data)} />;
  }

  if (companyIdParam && companyPrefill.isLoading) return <Skeleton className="h-64" />;

  const initial: ApplicationFormValues = {
    ...emptyApplication,
    companyId: companyIdParam,
    companyName: companyPrefill.data?.name || "",
  };

  return <ApplicationEditorForm key={`new-${companyIdParam}-${companyPrefill.data?.name || ""}`} mode="create" initial={initial} />;
}

function ApplicationEditorForm({
  mode,
  id,
  initial,
}: {
  mode: "create" | "edit";
  id?: string;
  initial: ApplicationFormValues;
}) {
  const router = useRouter();
  const client = useQueryClient();
  const [form, setForm] = useState(initial);
  const people = usePersonChoices();

  const save = useMutation({
    mutationFn: () =>
      api<Application>(mode === "create" ? "/api/applications" : `/api/applications/${id}`, {
        method: mode === "create" ? "POST" : "PUT",
        body: JSON.stringify({
          ...form,
          companyId: form.companyId || undefined,
          contactId: form.contactId || undefined,
        }),
      }),
    onSuccess: async (item: Application) => {
      toast.success(mode === "create" ? "Application added" : "Application updated");
      await client.invalidateQueries({ queryKey: ["applications"] });
      await client.invalidateQueries({ queryKey: ["dashboard"] });
      router.push(`/applications/${item.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <PageHeader title={mode === "create" ? "Add application" : "Edit application"} description="Company and role are the only required pieces." />
      <div className="grid gap-4 rounded-lg border border-border bg-card p-5 md:grid-cols-2">
        <FormField label="Company" htmlFor="company">
          <Input
            id="company"
            value={form.companyName}
            onChange={(event) => setForm({ ...form, companyName: event.target.value, companyId: "" })}
            placeholder="Company name"
            required
          />
        </FormField>
        <FormField label="Role" htmlFor="role">
          <Input id="role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} required />
        </FormField>
        <FormField label="Job URL" htmlFor="url">
          <Input id="url" value={form.jobUrl} onChange={(event) => setForm({ ...form, jobUrl: event.target.value })} placeholder="https://" />
        </FormField>
        <FormField label="Date applied" htmlFor="date">
          <Input id="date" type="date" value={form.dateApplied} onChange={(event) => setForm({ ...form, dateApplied: event.target.value })} />
        </FormField>
        <FormField label="Status" htmlFor="status">
          <Select id="status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ApplicationStatus })}>
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>{APPLICATION_STATUS_LABELS[status]}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="CV version" htmlFor="cv">
          <Input id="cv" value={form.cvVersion} onChange={(event) => setForm({ ...form, cvVersion: event.target.value })} />
        </FormField>
        <FormField label="Contact" htmlFor="contact">
          <Select id="contact" value={form.contactId} onChange={(event) => setForm({ ...form, contactId: event.target.value })}>
            <option value="">No contact</option>
            {people.data?.items.map((person) => (
              <option key={person.id} value={person.id}>{person.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Follow-up date" htmlFor="follow">
          <Input id="follow" type="date" value={form.followUpDate} onChange={(event) => setForm({ ...form, followUpDate: event.target.value })} />
        </FormField>
        <div className="md:col-span-2">
          <FormField label="Next action" htmlFor="next">
            <Input id="next" value={form.nextAction} onChange={(event) => setForm({ ...form, nextAction: event.target.value })} />
          </FormField>
        </div>
        <div className="md:col-span-2">
          <FormField label="Cover letter or message notes" htmlFor="cover">
            <TextArea id="cover" value={form.coverLetterNotes} onChange={(event) => setForm({ ...form, coverLetterNotes: event.target.value })} />
          </FormField>
        </div>
        <div className="md:col-span-2">
          <FormField label="Notes" htmlFor="notes">
            <TextArea id="notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </FormField>
        </div>
      </div>
      <Button type="submit" loading={save.isPending} loadingLabel="Saving…">{mode === "create" ? "Add application" : "Save changes"}</Button>
    </form>
  );
}

export function ApplicationDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const item = useQuery({ queryKey: ["application", id], queryFn: () => api<Application>(`/api/applications/${id}`) });
  const remove = useMutation({
    mutationFn: () => api(`/api/applications/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Application deleted");
      router.push("/applications");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  if (item.isLoading) return <Skeleton className="h-48" />;
  if (item.isError || !item.data) return <ErrorState message="This application could not be loaded." onRetry={() => item.refetch()} />;
  const application = item.data;
  return (
    <div className="space-y-4">
      <PageHeader
        title={application.role}
        description={application.company?.name || "Application"}
        action={<div className="flex gap-2"><Button asChild variant="secondary"><Link href={`/applications/${id}/edit`}>Edit</Link></Button><Button variant="ghost" onClick={() => setConfirm(true)}>Delete</Button></div>}
      />
      <section className="rounded-lg border border-border bg-card p-5">
        <StatusBadge value={application.status} label={APPLICATION_STATUS_LABELS[application.status]} />
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Applied</dt><dd>{formatDay(application.dateApplied)}</dd></div>
          <div><dt className="text-muted-foreground">Follow up</dt><dd>{formatDay(application.followUpDate)}</dd></div>
          <div><dt className="text-muted-foreground">CV</dt><dd>{application.cvVersion || "—"}</dd></div>
          <div><dt className="text-muted-foreground">Contact</dt><dd>{application.contact ? <Link className="underline-offset-4 hover:underline" href={`/networking/${application.contact.id}`}>{application.contact.name}</Link> : "—"}</dd></div>
        </dl>
        {application.nextAction ? <p className="mt-4 text-sm font-medium">Next: {application.nextAction}</p> : null}
        {application.jobUrl ? <a className="mt-3 inline-block text-sm font-medium underline-offset-4 hover:underline" href={application.jobUrl} target="_blank" rel="noreferrer">Open job post</a> : null}
        {application.coverLetterNotes ? <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">{application.coverLetterNotes}</p> : null}
        {application.notes ? <p className="mt-4 whitespace-pre-wrap text-sm">{application.notes}</p> : null}
      </section>
      <ConfirmDialog open={confirm} title="Delete this application?" description="The application and its follow-up actions will be deleted. Interviews stay, without this link." loading={remove.isPending} onOpenChange={setConfirm} onConfirm={() => remove.mutate()} />
    </div>
  );
}
