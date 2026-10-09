import type { Metadata } from "next";
import { Suspense } from "react";
import { ApplicationDetailPage, ApplicationEditor, ApplicationsPage } from "@/features/applications/application-pages";

export const metadata: Metadata = { title: "Applications" };

export function ApplicationsRoute() {
  return <Suspense><ApplicationsPage /></Suspense>;
}

export function NewApplicationRoute() {
  return <Suspense><ApplicationEditor mode="create" /></Suspense>;
}

export function ApplicationRoute({ id }: { id: string }) {
  return <ApplicationDetailPage id={id} />;
}

export function EditApplicationRoute({ id }: { id: string }) {
  return <Suspense><ApplicationEditor mode="edit" id={id} /></Suspense>;
}
