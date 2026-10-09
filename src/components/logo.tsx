import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8 shrink-0 text-primary", className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M21.6 10.8a7.15 7.15 0 1 0 .15 10.35"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="3.15"
        strokeLinecap="round"
      />
      <rect x="20.15" y="14.15" width="5.1" height="3.7" rx="1.05" fill="var(--primary-foreground)" />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  compact = false,
}: {
  className?: string;
  markClassName?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span className={cn("truncate font-semibold tracking-[-0.03em]", compact ? "text-sm" : "text-[15px]")}>
        Career OS
      </span>
    </span>
  );
}
