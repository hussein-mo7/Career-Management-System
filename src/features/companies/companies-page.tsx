"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, PageHeader, Pagination, Skeleton, StatusBadge } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/fields";
import {
  COMPANY_STATUSES,
  COMPANY_STATUS_LABELS,
  COMPANY_TYPES,
  COMPANY_TYPE_LABELS,
  FIT_LABELS,
  REMOTE_LABELS,
  REMOTE_MODELS,
} from "@/lib/constants";
import { api } from "@/lib/api";
import { useDebounced, useListParams } from "@/features/shared";
import type { Company, Page } from "@/types";

export function CompaniesPage() {
  const { params, page, setParam, query } = useListParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const debounced = useDebounced(search);
  const request = useQuery({
    queryKey: ["companies", query, debounced],
    queryFn: () => {
      const next = new URLSearchParams(query);
      if (debounced) next.set("q", debounced);
      else next.delete("q");
      return api<Page<Company>>(`/api/companies?${next.toString()}`);
    },
  });

  return (
    <div>
      <PageHeader
        title="Companies"
        description="A short list of places that might actually fit how you want to grow."
        action={
          <Button asChild>
            <Link href="/companies/new">Add company</Link>
          </Button>
        }
      />
      <div className="mb-4 grid gap-2 md:grid-cols-5">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search companies" aria-label="Search companies" />
        <Select value={params.get("status") || ""} onChange={(event) => setParam("status", event.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {COMPANY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {COMPANY_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
        <Select value={params.get("type") || ""} onChange={(event) => setParam("type", event.target.value)} aria-label="Type">
          <option value="">All types</option>
          {COMPANY_TYPES.map((type) => (
            <option key={type} value={type}>
              {COMPANY_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
        <Select value={params.get("remote") || ""} onChange={(event) => setParam("remote", event.target.value)} aria-label="Remote model">
          <option value="">All remote models</option>
          {REMOTE_MODELS.map((model) => (
            <option key={model} value={model}>
              {REMOTE_LABELS[model]}
            </option>
          ))}
        </Select>
        <Select value={params.get("fit") || ""} onChange={(event) => setParam("fit", event.target.value)} aria-label="Fit rating">
          <option value="">Any fit</option>
          {[5, 4, 3, 2, 1].map((score) => (
            <option key={score} value={score}>
              {score} · {FIT_LABELS[score]}
            </option>
          ))}
        </Select>
      </div>
      {request.data?.facets?.countries && request.data.facets.countries.length > 0 ? (
        <div className="mb-4 max-w-xs">
          <Select value={params.get("country") || ""} onChange={(event) => setParam("country", event.target.value)} aria-label="Country">
            <option value="">All countries</option>
            {request.data.facets.countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      {request.isLoading ? <Skeleton className="h-64" /> : null}
      {request.isError ? <ErrorState message="Companies could not be loaded." onRetry={() => request.refetch()} /> : null}
      {request.data && request.data.items.length === 0 ? (
        <EmptyState
          title="No target companies yet."
          description="Keep a focused list of companies with real products, real users, and a place for you to grow."
          action={
            <Button asChild>
              <Link href="/companies/new">Add your first company</Link>
            </Button>
          }
        />
      ) : null}
      {request.data && request.data.items.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-lg border border-border md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Remote</th>
                  <th className="px-4 py-3 font-medium">Fit</th>
                  <th className="px-4 py-3 font-medium">Next action</th>
                </tr>
              </thead>
              <tbody>
                {request.data.items.map((company) => (
                  <tr key={company.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link href={`/companies/${company.id}`} className="font-medium hover:underline">
                        {company.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{company.country || company.location || "Location unknown"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={company.status} label={COMPANY_STATUS_LABELS[company.status]} />
                    </td>
                    <td className="px-4 py-3">{REMOTE_LABELS[company.remoteModel]}</td>
                    <td className="px-4 py-3">{company.fitRating ? `${company.fitRating} · ${FIT_LABELS[company.fitRating]}` : "—"}</td>
                    <td className="px-4 py-3">{company.nextAction || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:hidden">
            {request.data.items.map((company) => (
              <Link key={company.id} href={`/companies/${company.id}`} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{company.name}</p>
                  <StatusBadge value={company.status} label={COMPANY_STATUS_LABELS[company.status]} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{company.nextAction || REMOTE_LABELS[company.remoteModel]}</p>
              </Link>
            ))}
          </div>
          <Pagination page={page} total={request.data.total} limit={request.data.limit} onPage={(next) => setParam("page", String(next))} />
        </>
      ) : null}
    </div>
  );
}
