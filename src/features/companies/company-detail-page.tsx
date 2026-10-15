"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CompanyForm, companyToForm, emptyCompany, type CompanyFormValues } from "@/features/companies/company-form";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialogs";
import {
  applicationLink,
  companyApplicationEditorPath,
  companyInterviewEditorPath,
  companyPersonEditorPath,
  companyReturnQuery,
  personLink,
} from "@/features/navigation/return-nav";
import { DetailBackLink, ErrorState, PageHeader, Skeleton, StatusBadge } from "@/components/ui/feedback";
import { RELATIONSHIP_LABELS } from "@/lib/constants";
import {
  COMPANY_STATUS_LABELS,
  COMPANY_TYPE_LABELS,
  FIT_LABELS,
  REMOTE_LABELS,
} from "@/lib/constants";
import { api } from "@/lib/api";
import { formatDateTime, formatDay } from "@/lib/format";
import type { Company } from "@/types";

type CompanyDetail = {
  company: Company;
  people: { id: string; name: string; role: string; relationshipType: string }[];
  applications: { id: string; role: string; status: string }[];
  activity: { id: string; type: string; title: string; detail: string; date: string; href: string }[];
};

export function CompanyEditor({ mode, id }: { mode: "create" | "edit"; id?: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const existing = useQuery({
    queryKey: ["company", id],
    queryFn: () => api<CompanyDetail>(`/api/companies/${id}`),
    enabled: mode === "edit" && Boolean(id),
  });
  const save = useMutation({
    mutationFn: (values: CompanyFormValues) =>
      api<Company>(mode === "create" ? "/api/companies" : `/api/companies/${id}`, {
        method: mode === "create" ? "POST" : "PUT",
        body: JSON.stringify(values),
      }),
    onSuccess: async (company: Company) => {
      toast.success(mode === "create" ? "Company added" : "Company updated");
      await client.invalidateQueries({ queryKey: ["companies"] });
      await client.invalidateQueries({ queryKey: ["dashboard"] });
      router.push(`/companies/${company.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (mode === "edit" && existing.isLoading) return <Skeleton className="h-80" />;
  if (mode === "edit" && existing.isError) return <ErrorState message="This company could not be loaded." onRetry={() => existing.refetch()} />;

  const back =
    mode === "edit" && id
      ? { href: `/companies/${id}`, label: "Back to company" }
      : { href: "/companies", label: "Back to companies" };

  return (
    <div>
      <DetailBackLink href={back.href} label={back.label} />
      <PageHeader
        title={mode === "create" ? "Add company" : `Edit ${existing.data?.company.name ?? "company"}`}
        description="The basics, a fit score, and why this company is worth targeting."
      />
      <CompanyForm
        key={existing.data?.company.updatedAt ?? "new"}
        initial={existing.data ? companyToForm(existing.data.company) : emptyCompany}
        onSubmit={(values) => save.mutate(values)}
        loading={save.isPending}
        submitLabel={mode === "create" ? "Add company" : "Save changes"}
      />
    </div>
  );
}

export function CompanyDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const detail = useQuery({ queryKey: ["company", id], queryFn: () => api<CompanyDetail>(`/api/companies/${id}`) });
  const [confirm, setConfirm] = useState(false);

  const remove = useMutation({
    mutationFn: () => api(`/api/companies/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Company deleted");
      await client.invalidateQueries({ queryKey: ["companies"] });
      router.push("/companies");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (detail.isLoading) return <Skeleton className="h-80" />;
  if (detail.isError || !detail.data) return <ErrorState message="This company could not be loaded." onRetry={() => detail.refetch()} />;

  const { company, people, applications, activity } = detail.data;
  const location = [company.location, company.country].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <DetailBackLink href="/companies" label="Back to companies" />
      <PageHeader
        title={company.name}
        description={location || "Target company"}
        action={
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link href={`/companies/${id}/edit`}>Edit</Link>
            </Button>
            <Button variant="ghost" onClick={() => setConfirm(true)}>
              Delete
            </Button>
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Website" value={company.website ? <a href={company.website} className="break-all underline-offset-4 hover:underline" target="_blank" rel="noreferrer">{company.website}</a> : "—"} />
        <Fact label="Location" value={company.location || "—"} />
        <Fact label="Country" value={company.country || "—"} />
        <Fact label="Industry" value={company.industry || "—"} />
        <Fact label="Company size" value={company.size || "—"} />
        <Fact label="Remote model" value={REMOTE_LABELS[company.remoteModel]} />
        <Fact label="Status" value={COMPANY_STATUS_LABELS[company.status]} />
        <Fact label="Company type" value={company.types.map((type) => COMPANY_TYPE_LABELS[type]).join(", ") || "—"} />
        <Fact label="Fit score" value={company.fitRating ? `${company.fitRating} · ${FIT_LABELS[company.fitRating]}` : "Not rated"} />
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">Why this company?</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{company.whyInterests || "Not written yet."}</p>
      </section>

      <section className="rounded-lg border border-primary/30 bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">What should I do next?</p>
        <p className="mt-2 text-lg font-semibold">{company.nextAction || "Choose the next concrete step."}</p>
        <p className="mt-1 text-sm text-muted-foreground">{company.nextActionDate ? formatDay(company.nextActionDate) : "No date yet"}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="secondary">
            <Link href={companyPersonEditorPath(id)}>Add person</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href={companyApplicationEditorPath(id)}>Add application</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href={companyInterviewEditorPath(id)}>Add interview</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <RecordList title="People" empty="No one from this company yet." href={companyPersonEditorPath(id)} action="Add person">
          {people.map((person) => (
            <Link key={person.id} href={personLink(person.id, id)} className="block py-2 text-sm hover:underline">
              <span className="font-medium">{person.name}</span>
              <span className="text-muted-foreground"> · {person.role || "Contact"}</span>
              {person.relationshipType && person.relationshipType !== "other" ? (
                <span className="mt-1 block">
                  <StatusBadge
                    value={person.relationshipType}
                    label={RELATIONSHIP_LABELS[person.relationshipType as keyof typeof RELATIONSHIP_LABELS] || person.relationshipType}
                  />
                </span>
              ) : null}
            </Link>
          ))}
        </RecordList>
        <RecordList title="Applications" empty="No applications yet." href={companyApplicationEditorPath(id)} action="Add application">
          {applications.map((application) => (
            <Link key={application.id} href={applicationLink(application.id, id)} className="block py-2 text-sm hover:underline">
              {application.role}
            </Link>
          ))}
        </RecordList>
      </section>

      <section>
        <h2 className="font-semibold">Activity</h2>
        {activity.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Conversations, applications, and interviews will collect here.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {activity.map((item) => (
              <li key={item.id}>
                <Link
                  href={
                    item.href && !item.href.startsWith(`/companies/${id}`)
                      ? `${item.href}${companyReturnQuery(id)}`
                      : item.href || `/companies/${id}`
                  }
                  className="block rounded-lg border border-border bg-card px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.type} · {formatDateTime(item.date)}</p>
                  <p className="mt-1 text-sm font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={confirm}
        title={`Delete ${company.name}?`}
        description="This deletes the company and its linked people, conversations, applications, interviews, and actions."
        loading={remove.isPending}
        onOpenChange={setConfirm}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function RecordList({
  title,
  empty,
  href,
  action,
  children,
}: {
  title: string;
  empty: string;
  href: string;
  action: string;
  children: React.ReactNode;
}) {
  const list = Array.isArray(children) ? children : [children];
  const hasItems = list.some(Boolean);
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <Link href={href} className="text-sm font-medium underline-offset-4 hover:underline">
          {action}
        </Link>
      </div>
      <div className="mt-2">{hasItems ? children : <p className="text-sm text-muted-foreground">{empty}</p>}</div>
    </section>
  );
}
