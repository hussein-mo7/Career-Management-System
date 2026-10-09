import type { Metadata } from "next";
import { Suspense } from "react";
import { NetworkingPage, PersonDetailPage, PersonEditor } from "@/features/networking/networking-pages";

export const metadata: Metadata = { title: "Networking" };

export function NetworkingRoute() {
  return (
    <Suspense>
      <NetworkingPage />
    </Suspense>
  );
}

export function NewPersonRoute() {
  return (
    <Suspense>
      <PersonEditor mode="create" />
    </Suspense>
  );
}

export function PersonRoute({ id }: { id: string }) {
  return <PersonDetailPage id={id} />;
}

export function EditPersonRoute({ id }: { id: string }) {
  return (
    <Suspense>
      <PersonEditor mode="edit" id={id} />
    </Suspense>
  );
}
