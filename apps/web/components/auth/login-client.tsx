"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AuthSession,
  DemoLoginRequest,
} from "@financial-dashboard/shared";
import { apiRequest } from "../../lib/api";
import { saveAuthSession } from "../../lib/auth";
import { appRoutes } from "../../lib/routes";

const demoEmail = "leo@example.com";

export function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState(demoEmail);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const session = await apiRequest<AuthSession>("/api/auth/login", {
        method: "POST",
        body: { email } satisfies DemoLoginRequest,
      });

      saveAuthSession(session);
      router.push(appRoutes.dashboard);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to start demo session.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-5 text-neutral-950 sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm lg:grid-cols-[1fr_0.85fr]">
        <div className="flex flex-col justify-between p-6 sm:p-10">
          <nav className="flex items-center justify-between">
            <p className="text-sm font-semibold tracking-[-0.02em]">
              Financial OS
            </p>
            <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-500">
              Demo access
            </span>
          </nav>

          <div className="py-16">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-500">
              Sign in
            </p>
            <h1 className="mt-5 max-w-2xl text-5xl font-semibold tracking-[-0.06em] sm:text-7xl">
              Access your financial workspace.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-500">
              This MVP uses a seeded demo user so the portfolio can show the
              authenticated product flow before real auth is added.
            </p>
          </div>

          <p className="max-w-md text-sm leading-6 text-neutral-500">
            Production auth later: passwordless email, secure HTTP-only cookies,
            refresh tokens and route guards.
          </p>
        </div>

        <div className="border-t border-neutral-200 bg-neutral-50 p-6 sm:p-10 lg:border-l lg:border-t-0">
          <form
            onSubmit={handleSubmit}
            className="flex h-full min-h-[32rem] flex-col justify-center"
          >
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                Demo login
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Use the seeded user to enter the dashboard.
              </p>

              <label className="mt-8 block">
                <span className="text-sm font-medium text-neutral-700">
                  Email
                </span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-950"
                  placeholder={demoEmail}
                />
              </label>

              {error ? (
                <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 inline-flex w-full justify-center rounded-full bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Starting session..." : "Enter dashboard"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
