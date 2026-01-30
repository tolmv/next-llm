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

export function ChatPanel() {
  const user = useUser();
  const [messages, setMessages] = useAtom(messagesAtom);
  const [input, setInput] = useAtom(inputAtom);
  const [isStreaming, setIsStreaming] = useAtom(isStreamingAtom);

  const { messages: chatMessages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  const handleInputChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setInput(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    await sendMessage({ text: trimmed });
    setInput("");
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
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          This dashboard is available only to authenticated users.
          <div className="mt-4">
            <Link
              href="/handler/sign-in"
              className="rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:border-zinc-300"
            >
              Sign in
            </Link>
          </div>
        </div>
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
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          {isStreaming ? "Streaming" : "Idle"}
        </div>
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
