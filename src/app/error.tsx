"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold">This page could not be loaded</h1>
      <button type="button" onClick={reset} className="mt-4 text-sm font-medium underline-offset-4 hover:underline">
        Try again
      </button>
    </main>
  );
}
