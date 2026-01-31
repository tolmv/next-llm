"use client";

import Link from "next/link";
import { UserButton, useUser } from "@stackframe/stack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Header() {
  const user = useUser();

  return (
    <header className="flex w-full items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 text-sm text-zinc-800">
      <div className="flex items-center gap-3">
        <Badge className="bg-zinc-900 text-white uppercase tracking-wide">
          Next LLM
        </Badge>
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <span className="text-zinc-500">
            Signed in as {user.displayName ?? user.primaryEmail ?? "User"}
          </span>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href="/handler/sign-in">Sign in</Link>
          </Button>
        )}
        <UserButton />
      </div>
    </header>
  );
}
