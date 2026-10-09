import type { Metadata } from "next";
import { Suspense } from "react";
import { CompaniesPage } from "@/features/companies/companies-page";

export const metadata: Metadata = { title: "Companies" };

export default function Page() {
  return (
    <Suspense>
      <CompaniesPage />
    </Suspense>
  );
}
