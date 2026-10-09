import type { Metadata } from "next";
import { EditPersonRoute } from "@/features/networking/routes";

export const metadata: Metadata = { title: "Edit person" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditPersonRoute id={id} />;
}
