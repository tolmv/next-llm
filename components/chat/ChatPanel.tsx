"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAtom } from "jotai";
import { useUser } from "@stackframe/stack";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { inputAtom, isStreamingAtom, messagesAtom } from "@/state/chat";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ChatUIMessage } from "@/lib/ai-types";

export function ChatPanel() {
  const user = useUser();
  const [messages, setMessages] = useAtom(messagesAtom);
  const [input, setInput] = useAtom(inputAtom);
  const [isStreaming, setIsStreaming] = useAtom(isStreamingAtom);

  const {
    messages: chatMessages,
    sendMessage,
    status,
    stop,
  } = useChat<ChatUIMessage>({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    console.log("Before clearing input:", input);
    setInput("");
    console.log("After setInput('') called");
    await sendMessage({ text: trimmed });
    console.log("After sendMessage completed");
  };

  useEffect(() => {
    setMessages(chatMessages);
  }, [chatMessages, setMessages]);

  useEffect(() => {
    setIsStreaming(isLoading);
  }, [isLoading, setIsStreaming]);

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
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">
            Streaming Chat Studio
          </h2>
          <p className="text-sm text-zinc-500">
            Jotai drives UI state; messages stream from the AI route.
          </p>
        </div>
        <Badge className={isStreaming ? "bg-emerald-600" : "bg-zinc-500"}>
          {isStreaming ? "Streaming" : "Idle"}
        </Badge>
      </div>

      <MessageList messages={messages} />

      <MessageInput
        input={input}
        isLoading={isLoading}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        onStop={stop}
      />
    </section>
  );
}
