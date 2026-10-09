import type { Metadata } from "next";
import { InterviewsRoute } from "@/features/interviews/routes";

export const metadata: Metadata = { title: "Interviews" };

export default function Page() {
  return <InterviewsRoute />;
}
