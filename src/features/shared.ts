"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Company, Page, Person } from "@/types";

export function useDebounced(value: string, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useListParams() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = Math.max(1, Number(params.get("page") || "1") || 1);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return { params, page, setParam, query: params.toString() };
}

export function useCompanyChoices() {
  return useQuery({
    queryKey: ["companies", "choices"],
    queryFn: () => api<Page<Company>>("/api/companies?limit=50"),
  });
}

export function useCompanyPrefill(companyId: string) {
  return useQuery({
    queryKey: ["company-prefill", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const data = await api<{ company: Company }>(`/api/companies/${companyId}`);
      return data.company;
    },
  });
}

export function usePersonChoices(companyId?: string) {
  const query = companyId ? `?limit=50&companyId=${companyId}` : "?limit=50";
  return useQuery({
    queryKey: ["people", "choices", companyId || "all"],
    queryFn: () => api<Page<Person>>(`/api/people${query}`),
  });
}
