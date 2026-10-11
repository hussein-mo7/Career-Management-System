"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type FieldErrors, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { COMPANY_STATUSES, COMPANY_STATUS_LABELS, COMPANY_TYPES, COMPANY_TYPE_LABELS, REMOTE_LABELS, REMOTE_MODELS } from "@/lib/constants";
import { toDateInput } from "@/lib/format";
import { companySchema } from "@/schemas";
import type { Company } from "@/types";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/controls";
import { FormField, Input, Select, TextArea } from "@/components/ui/fields";

export type CompanyFormValues = {
  name: string;
  website: string;
  location: string;
  country: string;
  industry: string;
  types: string[];
  size: string;
  remoteModel: string;
  whyInterests: string;
  nextAction: string;
  nextActionDate: string;
  status: string;
  fitRating: number | null;
};

export const emptyCompany: CompanyFormValues = {
  name: "",
  website: "",
  location: "",
  country: "",
  industry: "",
  types: [],
  size: "",
  remoteModel: "unknown",
  whyInterests: "",
  nextAction: "",
  nextActionDate: "",
  status: "discovered",
  fitRating: null,
};

export function companyToForm(company: Company): CompanyFormValues {
  return {
    name: company.name,
    website: company.website,
    location: company.location,
    country: company.country,
    industry: company.industry,
    types: company.types,
    size: company.size,
    remoteModel: company.remoteModel,
    whyInterests: company.whyInterests,
    nextAction: company.nextAction,
    nextActionDate: toDateInput(company.nextActionDate),
    status: company.status,
    fitRating: company.fitRating,
  };
}

export function CompanyForm({
  initial,
  onSubmit,
  loading,
  submitLabel,
}: {
  initial: CompanyFormValues;
  onSubmit: (values: CompanyFormValues) => void;
  loading: boolean;
  submitLabel: string;
}) {
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema) as Resolver<CompanyFormValues>,
    defaultValues: initial,
  });

  const watchedTypes = useWatch({ control: form.control, name: "types", defaultValue: initial.types });
  const types = Array.isArray(watchedTypes) ? watchedTypes : [];
  const fitRating = useWatch({ control: form.control, name: "fitRating", defaultValue: initial.fitRating ?? null });

  function onInvalid(errors: FieldErrors<CompanyFormValues>) {
    const message = Object.values(errors)
      .map((error) => (error && typeof error.message === "string" ? error.message : ""))
      .find(Boolean);
    toast.error(message || "Check the form and try again");
  }

  return (
    <form className="space-y-6" noValidate onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
      <section className="grid gap-4 rounded-lg border border-border bg-card p-5 md:grid-cols-2">
        <FormField label="Company name" htmlFor="name" error={form.formState.errors.name?.message}>
          <Input id="name" {...form.register("name")} />
        </FormField>
        <FormField label="Website" htmlFor="website" error={form.formState.errors.website?.message}>
          <Input id="website" placeholder="https://" {...form.register("website")} />
        </FormField>
        <FormField label="Location" htmlFor="location">
          <Input id="location" {...form.register("location")} />
        </FormField>
        <FormField label="Country" htmlFor="country">
          <Input id="country" {...form.register("country")} />
        </FormField>
        <FormField label="Industry" htmlFor="industry">
          <Input id="industry" {...form.register("industry")} />
        </FormField>
        <FormField label="Company size" htmlFor="size">
          <Input id="size" placeholder="About 8 engineers" {...form.register("size")} />
        </FormField>
        <FormField label="Remote model" htmlFor="remote">
          <Select id="remote" {...form.register("remoteModel")}>
            {REMOTE_MODELS.map((item) => (
              <option key={item} value={item}>
                {REMOTE_LABELS[item]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Status" htmlFor="status">
          <Select id="status" {...form.register("status")}>
            {COMPANY_STATUSES.map((item) => (
              <option key={item} value={item}>
                {COMPANY_STATUS_LABELS[item]}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="md:col-span-2">
          <p className="mb-2 text-sm font-medium">Company type</p>
          <div className="flex flex-wrap gap-3">
            {COMPANY_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={types.includes(type)}
                  onChange={(event) => {
                    const next = event.target.checked ? [...types, type] : types.filter((item) => item !== type);
                    form.setValue("types", next, { shouldDirty: true });
                  }}
                />
                {COMPANY_TYPE_LABELS[type]}
              </label>
            ))}
          </div>
        </div>
        <FormField label="Fit score">
          <Rating value={fitRating} onChange={(value) => form.setValue("fitRating", value, { shouldDirty: true })} />
        </FormField>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-card p-5">
        <FormField label="Why this company?" htmlFor="why">
          <TextArea id="why" {...form.register("whyInterests")} />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Next action" htmlFor="next">
            <Input id="next" {...form.register("nextAction")} />
          </FormField>
          <FormField label="Next action date" htmlFor="nextDate">
            <Input id="nextDate" type="date" {...form.register("nextActionDate")} />
          </FormField>
        </div>
      </section>
      {form.formState.submitCount > 0 && Object.keys(form.formState.errors).length > 0 ? (
        <p className="text-sm text-destructive" role="alert">
          {Object.values(form.formState.errors)
            .map((error) => (error && typeof error.message === "string" ? error.message : ""))
            .filter(Boolean)
            .join(" ")}
        </p>
      ) : null}
      <Button type="submit" loading={loading} loadingLabel="Saving…">
        {submitLabel}
      </Button>
    </form>
  );
}
