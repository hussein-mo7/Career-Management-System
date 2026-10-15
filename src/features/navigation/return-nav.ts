import type { ReadonlyURLSearchParams } from "next/navigation";

export type BackTarget = { href: string; label: string; companyId?: string };

const RETURN_ID_KEYS = ["companyId", "applicationId", "interviewId"] as const;

export function buildReturnQuery(from: string, ids?: Partial<Record<(typeof RETURN_ID_KEYS)[number], string>>) {
  const params = new URLSearchParams({ from });
  for (const key of RETURN_ID_KEYS) {
    const value = ids?.[key];
    if (value) params.set(key, value);
  }
  return `?${params.toString()}`;
}

export function companyReturnQuery(companyId: string) {
  return buildReturnQuery("company", { companyId });
}

/** Serialize `from` + id params from the current URL for child links and post-save redirects. */
export function returnQueryFromSearchParams(params: Pick<ReadonlyURLSearchParams, "get">) {
  const from = params.get("from");
  if (!from) {
    const companyId = params.get("companyId");
    if (companyId) return companyReturnQuery(companyId);
    return "";
  }
  const next = new URLSearchParams({ from });
  for (const key of RETURN_ID_KEYS) {
    const value = params.get(key);
    if (value) next.set(key, value);
  }
  return `?${next.toString()}`;
}

export function appendReturnQuery(path: string, returnQuery: string) {
  return returnQuery ? `${path}${returnQuery}` : path;
}

export function backTargetFromParams(params: Pick<ReadonlyURLSearchParams, "get">): BackTarget | null {
  const from = params.get("from");
  if (from === "company") {
    const companyId = params.get("companyId");
    if (companyId) return { href: `/companies/${companyId}`, label: "Back to company", companyId };
  }
  if (from === "companies") return { href: "/companies", label: "Back to companies" };
  if (from === "applications") return { href: "/applications", label: "Back to applications" };
  if (from === "application") {
    const applicationId = params.get("applicationId");
    if (applicationId) return { href: `/applications/${applicationId}`, label: "Back to application" };
    return { href: "/applications", label: "Back to applications" };
  }
  if (from === "interviews") return { href: "/interviews", label: "Back to interviews" };
  if (from === "interview") {
    const interviewId = params.get("interviewId");
    if (interviewId) return { href: `/interviews/${interviewId}`, label: "Back to interview" };
    return { href: "/interviews", label: "Back to interviews" };
  }
  if (from === "networking") return { href: "/networking", label: "Back to networking" };

  const companyId = params.get("companyId");
  if (companyId && !from) return { href: `/companies/${companyId}`, label: "Back to company", companyId };

  return null;
}

export function resolveBackLink(params: Pick<ReadonlyURLSearchParams, "get">, fallback: BackTarget): BackTarget {
  return backTargetFromParams(params) ?? fallback;
}

export function personLink(id: string, companyId?: string) {
  return appendReturnQuery(`/networking/${id}`, companyId ? companyReturnQuery(companyId) : "");
}

export function applicationLink(id: string, companyId?: string) {
  return appendReturnQuery(`/applications/${id}`, companyId ? companyReturnQuery(companyId) : "");
}

export function interviewLink(id: string, companyId?: string) {
  return appendReturnQuery(`/interviews/${id}`, companyId ? companyReturnQuery(companyId) : "");
}

export function companyPersonEditorPath(companyId: string) {
  return `/networking/new${companyReturnQuery(companyId)}`;
}

export function companyApplicationEditorPath(companyId: string) {
  return `/applications/new${companyReturnQuery(companyId)}`;
}

export function companyInterviewEditorPath(companyId: string) {
  return `/interviews/new${companyReturnQuery(companyId)}`;
}

/** @deprecated Use returnQueryFromSearchParams */
export function personReturnQuery(params: Pick<ReadonlyURLSearchParams, "get">) {
  return returnQueryFromSearchParams(params);
}

/** @deprecated Use backTargetFromParams */
export function companyBackFromParams(params: Pick<ReadonlyURLSearchParams, "get">) {
  return backTargetFromParams(params);
}
