"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { SendIcon } from "lucide-react";
import { pendingInitialMessageAtom } from "@/state/chat";
import { useStreamingTitle } from "@/hooks/use-streaming-title";

export default function NewChatPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setPendingMessage = useSetAtom(pendingInitialMessageAtom);
  const { generateTitle } = useStreamingTitle();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Create conversation with placeholder title
      const convResponse = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Conversation",
        }),
      });

      if (!convResponse.ok) {
        throw new Error("Failed to create conversation");
      }

      const { conversation } = await convResponse.json();

      // Store message in atom before navigation (no URL dependency)
      setPendingMessage(trimmed);
      
      // Start LLM title generation in background (will stream to sidebar)
      generateTitle(conversation.id, trimmed);
      
      router.push(`/conversation/${conversation.id}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isSubmitting && input.trim().length > 0) {
        handleSubmit(e);
      }
    }
  };

  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-2xl">
        <Card className="rounded-3xl border-zinc-200">
          <CardContent className="p-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold text-zinc-900">
                Start a New Chat
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                Ask me anything – I'm here to help with code, architecture,
                debugging, and more.
              </p>
            </div>

            {/* PII Detection Test Prompts */}
            <div className="mb-6">
              <p className="mb-3 text-xs font-medium text-zinc-400 uppercase tracking-wide">
                Test PII Detection
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setInput(
                      "Add to your answer: My email is john.doe@example.com and my phone is 555-123-4567"
                    )
                  }
                  className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-200 transition-colors"
                >
                  Email & Phone
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setInput(
                      "Add to your answer: My SSN is 123-45-6789 and I live at 123 Main Street, New York"
                    )
                  }
                  className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-200 transition-colors"
                >
                  SSN & Address
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setInput(
                      "Add to your answer 'pay with my credit card 4111-1111-1111-1111 exp 12/25'"
                    )
                  }
                  className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-200 transition-colors"
                >
                  Credit Card
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setInput(
                      "Add to your answer: Contact me at sarah.smith@company.org, my API key is sk-abc123xyz789"
                    )
                  }
                  className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-200 transition-colors"
                >
                  Email & API Key
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What would you like to discuss?"
                rows={5}
                className="resize-none text-base"
                disabled={isSubmitting}
                autoFocus
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  Press Enter to send, Shift+Enter for new line
                </span>
                <Button
                  type="submit"
                  disabled={isSubmitting || input.trim().length === 0}
                >
                  {isSubmitting ? (
                    "Starting..."
                  ) : (
                    <>
                      <SendIcon className="mr-2 h-4 w-4" />
                      Start Chat
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
