import type { Metadata } from "next";
import { NewPersonRoute } from "@/features/networking/routes";

export const metadata: Metadata = { title: "Add person" };

export default function Page() {
  return <NewPersonRoute />;
}
