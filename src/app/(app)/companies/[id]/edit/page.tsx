import type { Metadata } from "next";
import { CompanyEditor } from "@/features/companies/company-detail-page";

export const metadata: Metadata = { title: "Edit company" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CompanyEditor mode="edit" id={id} />;
}
