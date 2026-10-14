import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  children,
}: {
  className?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-secondary text-secondary-foreground",
    info: "bg-accent text-accent-foreground",
    success: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
    warning: "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100",
    danger: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  };
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

const statusTones: Record<string, "neutral" | "info" | "success" | "warning" | "danger"> = {
  discovered: "neutral",
  researching: "info",
  qualified: "success",
  networking: "info",
  applied: "info",
  interview: "warning",
  offer: "success",
  closed: "neutral",
  saved: "neutral",
  screening: "info",
  technical_interview: "warning",
  final_interview: "warning",
  rejected: "danger",
  withdrawn: "neutral",
  pending: "warning",
  completed: "info",
  passed: "success",
  cancelled: "neutral",
  done: "success",
  need_to_learn: "danger",
  practicing: "warning",
  comfortable: "success",
  mastered: "success",
  must_have: "danger",
  high: "warning",
  nice: "info",
  explore: "neutral",
  good: "success",
  neutral: "neutral",
  concern: "danger",
  unknown: "neutral",
};

export function StatusBadge({ value, label }: { value: string; label: string }) {
  return <Badge tone={statusTones[value] ?? "neutral"}>{label}</Badge>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-card px-6 py-8" role="alert">
      <h2 className="text-base font-semibold">Something went wrong</h2>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function DetailBackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </Link>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight break-words">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Pagination({
  page,
  total,
  limit,
  onPage,
}: {
  page: number;
  total: number;
  limit: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">
        Page {page} of {pages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-md border border-border bg-card px-3 py-1.5 disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="rounded-md border border-border bg-card px-3 py-1.5 disabled:opacity-50"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
