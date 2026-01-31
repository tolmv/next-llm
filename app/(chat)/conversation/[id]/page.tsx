"use client";

import { useEffect, useState, use, useRef } from "react";
import { useAtom } from "jotai";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatUIMessage, PiiChunkRange } from "@/lib/ai-types";
import { pendingInitialMessageAtom } from "@/state/chat";

type MessageMetadata = {
  piiRanges?: PiiChunkRange[];
};

type ConversationMessage = {
  id: string;
  conversationId: string;
  userId: string | null;
  role: string;
  content: string;
  metadata: MessageMetadata | null;
  createdAt: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function ConversationPage({ params }: PageProps) {
  const { id: conversationId } = use(params);
  const [pendingMessage, setPendingMessage] = useAtom(
    pendingInitialMessageAtom
  );
  const [input, setInput] = useState("");
  const initialMessageSent = useRef(false);

  // Track if this is a new conversation (set once, never changes)
  const isNewConversation = useRef(!!pendingMessage);

  // Skip loading if this is a new conversation
  const [loadingHistory, setLoadingHistory] = useState(
    !isNewConversation.current
  );

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

  // Load conversation history (only for existing conversations)
  useEffect(() => {
    // Skip if this is a new conversation - messages come from sendMessage, not DB
    if (isNewConversation.current) return;

    const loadConversation = async () => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}`);
        if (response.ok) {
          const data = await response.json();
          const messages: ConversationMessage[] = data.messages;

          // Convert database messages to AI SDK format with PII data
          const aiMessages: ChatUIMessage[] = messages.map((msg) => {
            const parts: ChatUIMessage["parts"] = [
              {
                type: "text" as const,
                text: msg.content,
              },
            ];

            // Add PII data part if metadata contains piiRanges
            if (msg.metadata?.piiRanges?.length) {
              parts.push({
                type: "data-pii" as const,
                data: { chunks: msg.metadata.piiRanges },
              });
            }

            return {
              id: msg.id,
              role: msg.role as "user" | "assistant",
              parts,
              createdAt: new Date(msg.createdAt),
            };
          });

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

  // Send initial message immediately (new conversation)
  useEffect(() => {
    if (initialMessageSent.current || !pendingMessage) return;

    initialMessageSent.current = true;

    // Clear atom immediately (no re-render race condition like URL changes)
    const message = pendingMessage;
    setPendingMessage(null);

    // Send the message
    sendMessage({ text: message });
  }, [pendingMessage, setPendingMessage, sendMessage]);

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

  return (
    <div className="mx-auto max-w-4xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <Badge className={isLoading ? "bg-emerald-600" : "bg-zinc-500"}>
          {isLoading ? "Streaming" : "Idle"}
        </Badge>
      </div>

      {loadingHistory ? (
        <div className="flex flex-col flex-1 gap-4">
          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-3 text-center">
              <Skeleton className="h-5 w-48 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
          </div>
          <div className="sticky bottom-0 bg-zinc-50 pt-4">
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 gap-4">
          <div className="flex-1 overflow-auto">
            <MessageList messages={chatMessages} />
          </div>
          <div className="sticky bottom-0 bg-zinc-50 pt-4">
            <MessageInput
              input={input}
              isLoading={isLoading}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              onStop={stop}
            />
          </div>
        </div>
      )}
    </div>
  );
}
