import Link from "next/link";
import { Suspense } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { Header } from "@/components/Header";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <Suspense
        fallback={
          <div className="flex w-full items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 text-sm text-zinc-500">
            <span>Loading session…</span>
          </div>
        }
      >
        <Header />
      </Suspense>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-semibold text-zinc-900">
              Hello World
            </h1>
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Quick Links
              </h2>
              <p className="text-sm text-zinc-500">
                Jump into auth flows and account management.
              </p>
            </div>
            <div className="flex flex-col gap-3 text-sm">
              <Link
                href="/handler/sign-in"
                className="rounded-xl border border-zinc-200 px-4 py-2 hover:border-zinc-300"
              >
                Sign in
              </Link>
              <Link
                href="/handler/sign-up"
                className="rounded-xl border border-zinc-200 px-4 py-2 hover:border-zinc-300"
              >
                Sign up
              </Link>
              <Link
                href="/handler/account-settings"
                className="rounded-xl border border-zinc-200 px-4 py-2 hover:border-zinc-300"
              >
                Account settings
              </Link>
            </div>
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-500">
              Make sure `NEXT_PUBLIC_STACK_PROJECT_ID`,
              `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`, and
              `STACK_SECRET_SERVER_KEY` are set locally.
            </div>
          </div>
        </section>

        <Suspense
          fallback={
            <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-8 text-sm text-zinc-500">
              Loading chat workspace…
            </div>
          }
        >
          <ChatPanel />
        </Suspense>
      </main>
    </div>
  );
}
