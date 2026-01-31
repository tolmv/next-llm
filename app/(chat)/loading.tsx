import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <div className="flex w-full items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}
