import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-5 text-neutral-950 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-7xl flex-col justify-between rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm sm:p-10">
        <nav className="flex items-center justify-between">
          <p className="text-sm font-semibold tracking-[-0.02em]">
            Financial OS
          </p>
          <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-500">
            MVP
          </span>
        </nav>

        <div className="max-w-4xl py-20">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-500">
            Portfolio project
          </p>
          <h1 className="mt-5 text-5xl font-semibold tracking-[-0.06em] text-neutral-950 sm:text-7xl">
            A minimal dashboard for personal finance intelligence.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-500">
            Next.js, NestJS, Prisma and PostgreSQL working together with Pluggy
            Open Finance synchronization and a clean analytics interface.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex justify-center rounded-full bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex justify-center rounded-full border border-neutral-200 px-6 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              Open dashboard
            </Link>
            <a
              href="http://localhost:3001/api/dashboard"
              className="inline-flex justify-center rounded-full border border-neutral-200 px-6 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              View API payload
            </a>
          </div>
        </div>

        <div className="grid gap-3 border-t border-neutral-200 pt-6 md:grid-cols-3">
          <ValuePill
            title="Backend"
            text="NestJS endpoints backed by Prisma."
          />
          <ValuePill
            title="Data"
            text="Pluggy imports with a local demo fallback."
          />
          <ValuePill
            title="Frontend"
            text="Runtime dashboard consuming the API."
          />
        </div>
      </section>
    </main>
  );
}

function ValuePill({ title, text }: { title: string; text: string }) {
  return (
    <article>
      <h2 className="font-medium tracking-[-0.02em]">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">{text}</p>
    </article>
  );
}
