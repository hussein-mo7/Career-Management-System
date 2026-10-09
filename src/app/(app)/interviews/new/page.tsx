import type { Metadata } from "next";
import { NewInterviewRoute } from "@/features/interviews/routes";

export const metadata: Metadata = { title: "Add interview" };

export default function Page() {
  return <NewInterviewRoute />;
}
