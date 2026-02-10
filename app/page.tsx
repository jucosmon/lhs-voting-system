import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Layers3,
  ShieldCheck,
  UserCog,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="app-shell">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-16 lg:px-12">
        <header className="panel flex flex-col gap-10 p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-accent-soft px-4 py-2 text-sm font-semibold text-accent-strong">
              <BadgeCheck className="h-4 w-4" />
              SSLG Elections 2026
            </div>
            <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
              Lungsodaan High School SSLG Elections Hub
            </h1>
            <p className="max-w-2xl text-lg text-neutral-700">
              A kiosk-ready voting system for executive officers and grade level
              representatives, powered by Supabase and built for fast, fair,
              section-based voting.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-accent-strong"
                href="/ballot/demo-student"
              >
                Start Voting Demo
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-4 text-base font-semibold text-neutral-900 transition hover:border-neutral-300"
                href="/results"
              >
                Live Results
                <BarChart3 className="h-5 w-5" />
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Executive Offices",
                detail:
                  "President, VP, Secretary, Treasurer, Auditor, PIO, Protocol Officer",
              },
              {
                title: "Grade Level Reps",
                detail:
                  "Shifted by +1 grade to keep senior mentorship at the core",
              },
              {
                title: "Multi-Party",
                detail: "Support one or more party lists with custom colors",
              },
              {
                title: "Realtime",
                detail: "Supabase Realtime pushes results instantly",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-neutral-200 bg-white/80 p-4"
              >
                <h3 className="font-semibold text-neutral-900">{item.title}</h3>
                <p className="text-sm text-neutral-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Admin Portal",
              icon: UserCog,
              detail:
                "Manage sections, parties, and candidates in one dashboard.",
              href: "/admin",
            },
            {
              title: "Facilitator Portal",
              icon: UsersRound,
              detail:
                "Add students quickly, verify voter status, and open the ballot.",
              href: "/facilitator",
            },
            {
              title: "Results Center",
              icon: BarChart3,
              detail: "Instant tallies with section-level filtering.",
              href: "/results",
            },
          ].map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="panel focus-ring group flex h-full flex-col justify-between gap-6 p-8 transition hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-accent-soft p-3 text-accent-strong">
                  <card.icon className="h-6 w-6" />
                </span>
                <h2 className="text-2xl font-semibold text-neutral-900">
                  {card.title}
                </h2>
              </div>
              <p className="text-base text-neutral-700">{card.detail}</p>
              <span className="inline-flex items-center gap-2 text-base font-semibold text-accent-strong">
                Open workspace
                <ArrowRight className="h-5 w-5" />
              </span>
            </Link>
          ))}
        </section>

        <section className="panel grid gap-8 p-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-6">
            <h2 className="text-3xl font-semibold text-neutral-900">
              Secure, accountable, and easy to audit
            </h2>
            <p className="text-lg text-neutral-700">
              Every vote is recorded through a transaction-safe RPC function and
              instantly reflected on results dashboards. The UI is optimized for
              touch screens, clear visibility, and fast facilitation.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: ShieldCheck,
                  title: "Verified voters",
                  detail: "Students can vote only once per election.",
                },
                {
                  icon: Layers3,
                  title: "Structured data",
                  detail: "Supabase schema keeps sections and parties clean.",
                },
                {
                  icon: BadgeCheck,
                  title: "Grade shift logic",
                  detail: "Automatic rep visibility based on grade level.",
                },
                {
                  icon: BarChart3,
                  title: "Live analytics",
                  detail: "Realtime counts update as votes land.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-accent-strong" />
                    <h3 className="font-semibold text-neutral-900">
                      {item.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-neutral-200 bg-accent p-8 text-white">
            <h3 className="text-2xl font-semibold">Today&apos;s Quick Start</h3>
            <ul className="mt-6 space-y-4 text-base">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-highlight" />
                Add sections and party lists in the admin portal.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-highlight" />
                Register students with facilitators per section.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-highlight" />
                Launch ballot sessions and monitor results.
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
