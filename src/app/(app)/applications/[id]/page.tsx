import type { Metadata } from "next";
import { ApplicationRoute } from "@/features/applications/routes";

export const metadata: Metadata = { title: "Application" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ApplicationRoute id={id} />;
}
