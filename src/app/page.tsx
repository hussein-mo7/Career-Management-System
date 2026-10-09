import Link from "next/link";
import { ArrowRight, Compass, MessagesSquare, NotebookPen, Target } from "lucide-react";

const features = [
  {
    title: "Companies worth your time",
    text: "Research targets, record why they fit, and keep the concerns visible before you apply.",
    icon: Target,
  },
  {
    title: "People, not a CRM",
    text: "Remember who you met, what you learned, and the one next step after a coffee chat.",
    icon: MessagesSquare,
  },
  {
    title: "Interviews that teach",
    text: "Capture questions, mark what was weak, and move it from Need to Learn to Mastered.",
    icon: NotebookPen,
  },
  {
    title: "A direction you can see",
    text: "Keep the 4-year vision, the current search, and this week’s focus in one place.",
    icon: Compass,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            H
          </span>
          <span className="text-sm font-semibold">Hussein Career OS</span>
        </div>
        <Link
          href="/login"
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Log in
        </Link>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 pb-20">
        <section className="max-w-3xl py-16 md:py-24">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Personal career system
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance md:text-6xl">
            Capture what you learn. Decide what to do next.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Hussein Career OS is a private workspace for career direction, company research,
            networking, applications, interviews, and the practice that follows.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              Open the workspace
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
        <section className="grid gap-4 md:grid-cols-2" aria-label="Features">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-lg border border-border bg-card p-5">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
