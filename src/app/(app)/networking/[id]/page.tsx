import type { Metadata } from "next";
import { PersonRoute } from "@/features/networking/routes";

export const metadata: Metadata = { title: "Person" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PersonRoute id={id} />;
}
