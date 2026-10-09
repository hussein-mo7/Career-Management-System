import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";

const steps = [
  {
    number: "01",
    title: "Capture",
    text: "Write down the company, the conversation, or the interview while it is still clear.",
  },
  {
    number: "02",
    title: "Learn",
    text: "Keep what was useful, what was weak, and the question you still need to practice.",
  },
  {
    number: "03",
    title: "Improve",
    text: "Move each topic from need to learn toward comfortable, one practice at a time.",
  },
  {
    number: "04",
    title: "Move forward",
    text: "Leave every record with one next step, so the week has a direction.",
  },
];

const areas = [
  {
    title: "Direction",
    text: "A long-term vision, the role you are aiming for now, and the skills you are building.",
  },
  {
    title: "Companies",
    text: "Why a company fits, what concerns you, and how it stands against your own criteria.",
  },
  {
    title: "Conversations",
    text: "Who you met, what you learned, and the follow-up that should happen next.",
  },
  {
    title: "Applications",
    text: "Roles, status, and the date you promised yourself you would follow up.",
  },
  {
    title: "Interviews",
    text: "The questions you were asked, how you answered, and what to practice before the next one.",
  },
  {
    title: "Practice",
    text: "A learning board that stays tied to real interviews, not a separate list of topics.",
  },
];

const preview = [
  { label: "Company", title: "Review fit and concerns", meta: "Research" },
  { label: "Conversation", title: "Send the follow-up you promised", meta: "This week" },
  { label: "Practice", title: "Move one question to Practicing", meta: "Learning" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-5 md:px-8">
          <Link href="/" aria-label="Career OS home" className="min-w-0">
            <Logo />
          </Link>
          <nav className="flex shrink-0 items-center gap-1 sm:gap-2" aria-label="Account">
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-md px-2.5 text-sm font-medium text-muted-foreground hover:text-foreground sm:px-3"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground sm:px-3.5"
            >
              <span className="sm:hidden">Open</span>
              <span className="hidden sm:inline">Open workspace</span>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-12 sm:gap-14 sm:px-5 sm:py-16 md:px-8 md:py-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          <div>
            <p className="text-sm font-medium text-primary">Career operating system</p>
            <h1 className="mt-4 max-w-xl text-[1.875rem] font-semibold leading-tight tracking-tight text-balance sm:text-4xl md:text-6xl md:leading-[1.05]">
              Keep what you learn. See the next step.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
              Career OS is a private workspace for direction, company research, conversations, applications, and the practice that follows an interview.
            </p>
            <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
              >
                Open workspace
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-card px-5 text-sm font-medium"
              >
                See the loop
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-3 shadow-[0_30px_80px_-48px_rgba(16,32,51,0.55)]">
            <div className="rounded-xl border border-border bg-background">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <p className="text-sm font-medium">This week</p>
                <p className="text-xs text-muted-foreground">Three next steps</p>
              </div>
              <ul className="divide-y divide-border">
                {preview.map((item) => (
                  <li key={item.label} className="flex items-start justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                      <p className="mt-1 text-sm font-medium break-words">{item.title}</p>
                    </div>
                    <span className="mt-1 shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                      {item.meta}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-border bg-card">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-5 sm:py-16 md:px-8 md:py-20">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">A loop, not a pile of records</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base md:leading-7">
                Every note should change what you do next. Career OS is built around that sequence.
              </p>
            </div>
            <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <li key={step.number}>
                  <p className="text-xs font-medium tracking-[0.16em] text-primary">{step.number}</p>
                  <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-5 sm:py-16 md:px-8 md:py-20" aria-label="What Career OS holds">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">One place for the whole search</h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((area) => (
              <article key={area.title} className="bg-card p-6">
                <h3 className="text-base font-semibold">{area.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{area.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-5 md:px-8">
          <Logo compact />
          <p className="text-sm text-muted-foreground">Direction, research, conversations, and practice.</p>
        </div>
      </footer>
    </div>
  );
}
