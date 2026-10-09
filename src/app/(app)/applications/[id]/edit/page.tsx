import type { Metadata } from "next";
import { EditApplicationRoute } from "@/features/applications/routes";

export const metadata: Metadata = { title: "Edit application" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditApplicationRoute id={id} />;
}
