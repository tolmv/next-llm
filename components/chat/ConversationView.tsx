"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@stackframe/stack";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { ConversationSelector } from "@/components/chat/ConversationSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ChatUIMessage } from "@/lib/ai-types";

type ConversationMessage = {
  id: string;
  conversationId: string;
  userId: string | null;
  role: string;
  content: string;
  createdAt: string;
};

export function ConversationView({
  conversationId,
}: {
  conversationId: string;
}) {
  const user = useUser();
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);

  const {
    messages: chatMessages,
    sendMessage,
    status,
    stop,
    setMessages,
  } = useChat<ChatUIMessage>({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        conversationId,
      },
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    const loadConversation = async () => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}`);
        if (response.ok) {
          const data = await response.json();
          const messages: ConversationMessage[] = data.messages;

          // Convert database messages to AI SDK format
          const aiMessages: ChatUIMessage[] = messages.map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            parts: [
              {
                type: "text" as const,
                text: msg.content,
              },
            ],
            createdAt: new Date(msg.createdAt),
          }));

          setMessages(aiMessages);
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadConversation();
  }, [conversationId, setMessages]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    await sendMessage({ text: trimmed });
  };

  if (!user) {
    return (
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">
              Streaming Chat Studio
            </h2>
            <p className="text-sm text-zinc-500">
              Sign in to access the chat workspace.
            </p>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="text-sm">
            This dashboard is available only to authenticated users.
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/handler/sign-in">Sign in</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.3fr_1fr]">
      <aside className="space-y-6">
        <ConversationSelector currentConversationId={conversationId} />
      </aside>

      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Badge className={isLoading ? "bg-emerald-600" : "bg-zinc-500"}>
            {isLoading ? "Streaming" : "Idle"}
          </Badge>
        </div>

        {loadingHistory ? (
          <Card className="border-dashed">
            <CardContent className="py-6 text-sm text-muted-foreground">
              Loading conversation history…
            </CardContent>
          </Card>
        ) : (
          <>
            <MessageList messages={chatMessages} />
            <MessageInput
              input={input}
              isLoading={isLoading}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              onStop={stop}
            />
          </>
        )}
      </section>
    </div>
  );
}
