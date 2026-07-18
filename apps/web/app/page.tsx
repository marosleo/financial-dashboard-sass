import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F3EFE4] px-6 py-8 text-[#1E2A24]">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-between overflow-hidden rounded-[2.5rem] border border-[#D8CCB5] bg-[#20352B] p-8 text-[#F7F1E3] shadow-[0_24px_80px_rgba(32,53,43,0.2)] md:p-12">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#C9B47E]">
            Financial Dashboard
          </p>
          <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-[#E7DDC8]">
            MVP
          </span>
        </div>
        <div className="max-w-4xl">
          <h1 className="mt-16 text-5xl font-semibold tracking-[-0.05em] md:text-7xl">
            Open Finance intelligence for personal spending.
        </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#E7DDC8]">
            A fullstack portfolio project with Next.js, NestJS, Prisma,
            PostgreSQL, seeded financial data, dashboard analytics, and an
            integration-ready architecture.
          </p>
          <Link
            href="/dashboard"
            className="mt-8 inline-flex rounded-full bg-[#C9B47E] px-6 py-3 text-sm font-semibold text-[#20352B] transition hover:bg-[#E2CD92]"
          >
            Open dashboard
          </Link>
        </div>
        <div className="grid gap-4 pt-12 md:grid-cols-3">
          <ValuePill title="Real backend" text="NestJS routes backed by Prisma models." />
          <ValuePill title="Portfolio data" text="Seeded transactions simulate Open Finance." />
          <ValuePill title="AI-ready" text="Insights module prepared for Claude integration." />
        </div>
      </section>
    </main>
  );
}

function ValuePill({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/10 p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#E7DDC8]">{text}</p>
    </article>
  );
}
