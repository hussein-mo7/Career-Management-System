import Link from "next/link";
import { Logo } from "@/components/logo";

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-5 sm:p-6">
        <Link href="/" aria-label="Career OS home">
          <Logo />
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
