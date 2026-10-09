import type { Metadata } from "next";
import { CompanyEditor } from "@/features/companies/company-detail-page";

export const metadata: Metadata = { title: "Add company" };

export default function Page() {
  return <CompanyEditor mode="create" />;
}
