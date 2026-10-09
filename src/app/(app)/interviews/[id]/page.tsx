import type { Metadata } from "next";
import { InterviewRoute } from "@/features/interviews/routes";

export const metadata: Metadata = { title: "Interview" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InterviewRoute id={id} />;
}
