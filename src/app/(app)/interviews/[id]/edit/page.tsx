import type { Metadata } from "next";
import { EditInterviewRoute } from "@/features/interviews/routes";

export const metadata: Metadata = { title: "Edit interview" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditInterviewRoute id={id} />;
}
