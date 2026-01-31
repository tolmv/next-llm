"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@stackframe/stack";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.replace("/handler/sign-in");
    }
  }, [user, router]);

  // Show nothing while loading or redirecting
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
