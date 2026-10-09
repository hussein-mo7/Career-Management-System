import type { Metadata } from "next";
import { Suspense } from "react";
import { InterviewDetailPage, InterviewEditor, InterviewsPage } from "@/features/interviews/interview-pages";

export const metadata: Metadata = { title: "Interviews" };

export function InterviewsRoute() {
  return <Suspense><InterviewsPage /></Suspense>;
}
export function NewInterviewRoute() {
  return <Suspense><InterviewEditor mode="create" /></Suspense>;
}
export function InterviewRoute({ id }: { id: string }) {
  return <InterviewDetailPage id={id} />;
}
export function EditInterviewRoute({ id }: { id: string }) {
  return <Suspense><InterviewEditor mode="edit" id={id} /></Suspense>;
}
