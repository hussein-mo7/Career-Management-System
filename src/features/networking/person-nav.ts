import type { ReadonlyURLSearchParams } from "next/navigation";

export function personReturnQuery(params: Pick<ReadonlyURLSearchParams, "get">) {
  if (params.get("from") !== "company") return "";
  const companyId = params.get("companyId");
  if (!companyId) return "";
  return `?from=company&companyId=${encodeURIComponent(companyId)}`;
}

export function personLink(id: string, companyId?: string) {
  if (!companyId) return `/networking/${id}`;
  return `/networking/${id}?from=company&companyId=${encodeURIComponent(companyId)}`;
}

export function companyBackFromParams(params: Pick<ReadonlyURLSearchParams, "get">) {
  const companyId = params.get("companyId");
  if (params.get("from") !== "company" || !companyId) return null;
  return { href: `/companies/${companyId}`, companyId, label: "Back to company" };
}

export function companyPersonEditorPath(companyId: string) {
  return `/networking/new?from=company&companyId=${encodeURIComponent(companyId)}`;
}
