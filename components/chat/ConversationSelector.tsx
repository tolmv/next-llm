"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon, MessageSquareIcon, Trash2Icon } from "lucide-react";

type Conversation = {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export function ConversationSelector({
  currentConversationId,
}: {
  currentConversationId?: string;
}) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/conversations");
      if (response.ok) {
        const data = await response.json();
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

  const handleNewConversation = async () => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/conversation/${data.conversation.id}`);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

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

  if (loading) {
    return (
      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-16" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3"
            >
              <Skeleton className="h-4 w-4 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Conversations</CardTitle>
          <Button size="sm" onClick={handleNewConversation}>
            <PlusIcon className="mr-2 h-4 w-4" />
            New
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {conversations.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-zinc-50 p-4 text-center text-sm text-muted-foreground">
            No conversations yet. Start a new one!
          </div>
        ) : (
          conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/conversation/${conversation.id}`}
            >
              <div
                className={`group flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-zinc-50 ${
                  currentConversationId === conversation.id
                    ? "border-zinc-400 bg-zinc-50"
                    : "border-zinc-200"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquareIcon className="h-4 w-4 flex-shrink-0 text-zinc-500" />
                  <div className="overflow-hidden">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {conversation.title || "Untitled"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(conversation.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={(e) => handleDeleteConversation(conversation.id, e)}
                >
                  <Trash2Icon className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
