import type { Metadata } from "next";
import { NewApplicationRoute } from "@/features/applications/routes";

export const metadata: Metadata = { title: "Add application" };

export default function Page() {
  return <NewApplicationRoute />;
}
