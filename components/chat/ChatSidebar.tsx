"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAtomValue } from "jotai";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon, MessageSquareIcon, Trash2Icon, SparklesIcon } from "lucide-react";
import { streamingTitlesAtom } from "@/state/chat";

type Conversation = {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export function ChatSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const streamingTitles = useAtomValue(streamingTitlesAtom);

  // Extract current conversation ID from pathname
  const currentConversationId = pathname.startsWith("/conversation/")
    ? pathname.split("/")[2]
    : undefined;

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/conversations");
      if (response.ok) {
        const data: { conversations: Conversation[] } = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Refetch when pathname changes (new conversation created)
  useEffect(() => {
    if (currentConversationId) {
      fetchConversations();
    }
  }, [currentConversationId]);

  // Refetch when streaming titles change (title generation complete)
  useEffect(() => {
    // When streamingTitles becomes empty after having items, refetch to get the final titles
    if (streamingTitles.size === 0) {
      fetchConversations();
    }
  }, [streamingTitles.size]);

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Delete this conversation?")) return;

    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (currentConversationId === id) {
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  return (
    <aside className="w-72 border-r border-zinc-200 bg-white flex flex-col h-full">
      <div className="p-4 border-b border-zinc-200">
        <Button className="w-full" asChild>
          <Link href="/">
            <PlusIcon className="mr-2 h-4 w-4" />
            New Chat
          </Link>
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Conversations
        </h3>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2">
                <Skeleton className="h-4 w-4 rounded" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-zinc-50 p-4 text-center text-sm text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/conversation/${conversation.id}`}
              >
                <div
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-zinc-100 ${
                    currentConversationId === conversation.id
                      ? "bg-zinc-100"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {streamingTitles.has(conversation.id) ? (
                      <SparklesIcon className="h-4 w-4 flex-shrink-0 text-purple-500 animate-pulse" />
                    ) : (
                      <MessageSquareIcon className="h-4 w-4 flex-shrink-0 text-zinc-500" />
                    )}
                    <div className="overflow-hidden">
                      <p className="truncate text-sm text-zinc-900">
                        {streamingTitles.get(conversation.id) || conversation.title || "Untitled"}
                        {streamingTitles.has(conversation.id) && (
                          <span className="inline-block w-1.5 h-4 ml-0.5 bg-purple-500 animate-pulse align-text-bottom" />
                        )}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(conversation.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) =>
                      handleDeleteConversation(conversation.id, e)
                    }
                  >
                    <Trash2Icon className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
