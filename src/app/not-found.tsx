import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">404</p>
      <h1 className="mt-3 text-3xl font-semibold">This page does not exist</h1>
      <Link href="/dashboard" className="mt-6 text-sm font-medium underline-offset-4 hover:underline">
        Back to the dashboard
      </Link>
    </main>
  );
}
