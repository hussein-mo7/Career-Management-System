import type { Metadata } from "next";
import { ApplicationsRoute } from "@/features/applications/routes";

export const metadata: Metadata = { title: "Applications" };

export default function Page() {
  return <ApplicationsRoute />;
}
