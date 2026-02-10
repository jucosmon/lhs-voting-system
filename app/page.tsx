import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  UserCog,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="app-shell">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 lg:px-12">
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
              A focused, kiosk-ready system for LHS SSLG elections. Manage
              sections and students, run ballots, and view live results in one
              place.
            </p>
          </div>
          <div className="rounded-3xl border border-neutral-200 bg-white/80 p-6">
            <h2 className="text-xl font-semibold text-neutral-900">
              Start here
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Choose a portal below to begin. Admins set up elections,
              facilitators manage sections, and results stay live.
            </p>
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
      </main>
    </div>
  );
}
