"use client";

import { FIT_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  onChange,
}: {
  value: number | null;
  onChange?: (value: number | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1" role="radiogroup" aria-label="Fit rating">
      {[1, 2, 3, 4, 5].map((score) => {
        const active = value != null && score <= value;
        return (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={value === score}
            aria-label={`${score} ${FIT_LABELS[score]}`}
            disabled={!onChange}
            onClick={() => onChange?.(value === score ? null : score)}
            className={cn(
              "h-9 w-9 rounded-md border text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {score}
          </button>
        );
      })}
      <span className="ml-2 text-sm text-muted-foreground">
        {value ? FIT_LABELS[value] : "Not rated"}
      </span>
    </div>
  );
}

export function TagInput({
  id,
  value,
  onChange,
  placeholder,
  suggestions = [],
}: {
  id?: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {value.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(value.filter((entry) => entry !== item))}
            className="rounded-md bg-secondary px-2 py-1 text-xs"
          >
            {item}
            <span className="sr-only">Remove {item}</span>
            <span aria-hidden="true"> ×</span>
          </button>
        ))}
      </div>
      <input
        id={id}
        className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder={placeholder}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          const next = event.currentTarget.value.trim();
          if (!next || value.some((item) => item.toLowerCase() === next.toLowerCase())) return;
          onChange([...value, next]);
          event.currentTarget.value = "";
        }}
      />
      {suggestions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions
            .filter((item) => !value.includes(item))
            .map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onChange([...value, item])}
                className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
              >
                Add {item}
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}
