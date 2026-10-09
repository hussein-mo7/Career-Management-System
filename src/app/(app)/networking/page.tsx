import type { Metadata } from "next";
import { NetworkingRoute } from "@/features/networking/routes";

export const metadata: Metadata = { title: "Networking" };

export default function Page() {
  return <NetworkingRoute />;
}
