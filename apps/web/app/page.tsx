export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
      <section className="rounded-3xl border border-stone-300 bg-white/80 p-10 shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
          Financial Dashboard
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-stone-900">
          Project skeleton ready for implementation.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
          Build the real dashboard screens, data flow, and user experience here.
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Suggested next step: replace this placeholder with your first product
          flow.
        </p>
      </section>
    </main>
  );
}
