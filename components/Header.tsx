"use client";

import Link from "next/link";
import { UserButton, useUser } from "@stackframe/stack";

export function Header() {
  const user = useUser();

  return (
    <header className="flex w-full items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 text-sm text-zinc-800">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          Next LLM
        </div>
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <span className="text-zinc-500">
            Signed in as {user.displayName ?? user.primaryEmail ?? "User"}
          </span>
        ) : (
          <Link
            className="rounded-full border border-zinc-200 px-3 py-1 text-zinc-700 hover:border-zinc-300"
            href="/handler/sign-in"
          >
            Sign in
          </Link>
        )}
        <UserButton />
      </div>
    </header>
  );
}
