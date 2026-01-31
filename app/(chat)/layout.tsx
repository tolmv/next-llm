import { Suspense } from "react";
import { Header } from "@/components/Header";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { AuthGuard } from "@/components/chat/AuthGuard";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <Suspense
        fallback={
          <div className="flex w-full items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        }
      >
        <Header />
      </Suspense>
      <Suspense
        fallback={
          <div className="flex h-[calc(100vh-65px)] items-center justify-center">
            <div className="space-y-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
          </div>
        }
      >
        <AuthGuard>
          <div className="flex h-[calc(100vh-65px)]">
            <ChatSidebar />
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
        </AuthGuard>
      </Suspense>
    </div>
  );
}
