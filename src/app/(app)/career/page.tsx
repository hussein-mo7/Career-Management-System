import type { Metadata } from "next";
import { CareerPage } from "@/features/career/career-page";

export const metadata: Metadata = { title: "Career" };

export default function Page() {
  return <CareerPage />;
}
