import type { Metadata } from "next";
import { CriteriaPage } from "@/features/criteria/criteria-page";

export const metadata: Metadata = { title: "Criteria" };

export default function Page() {
  return <CriteriaPage />;
}
