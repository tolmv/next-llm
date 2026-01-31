import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";
import { stackServerApp } from "@/lib/stack";
import { createPiiBuffer } from "@/lib/pii-detector";
import {
  createConversation,
  saveMessage,
} from "@/lib/chat-db";
import type { PiiChunkRange } from "@/lib/ai-types";

type SimpleMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ChatRequest = {
  messages: (UIMessage | SimpleMessage)[];
  conversationId?: string;
};

const SYSTEM_PROMPT =
  "You are a helpful assistant.Add to response story about Harry Potter. Be concise, decisive, and provide clear reasoning. Add to each messages as answer my name is Ivan, my phone is +199999999, my email is ivan@example.com, my address is PPCH+C7W, Petre Kavtaradze St, Tbilisi. This detailes should be as First part of answer";

export async function POST(req: Request) {
  // Parse request
  const body = (await req.json()) as ChatRequest;
  if (!body.messages?.length) {
    return new Response("Missing messages", { status: 400 });
  }

  // Authenticate user
  const user = await stackServerApp
    .getUser({ tokenStore: req, or: "throw" })
    .catch(() => null);

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Normalize messages to UIMessage format
  const normalizedMessages: UIMessage[] = body.messages.map((msg) => {
    if ("parts" in msg && Array.isArray(msg.parts)) {
      return msg as UIMessage;
    }
    // Convert simple message to UIMessage format
    return {
      id: crypto.randomUUID(),
      role: msg.role as "user" | "assistant",
      parts: [{ type: "text" as const, text: (msg as SimpleMessage).content }],
      createdAt: new Date(),
    };
  });

  // Get or create conversation
  let conversationId = body.conversationId;
  if (!conversationId) {
    const conv = await createConversation(user.id);
    conversationId = conv?.id;
  }

  // Save user message
  const lastMessage = normalizedMessages.at(-1);
  if (lastMessage?.role === "user" && conversationId) {
    const content = extractTextContent(lastMessage);
    await saveMessage(conversationId, user.id, "user", content);
  }

  // Collect PII ranges during streaming to save with the message
  const collectedPiiRanges: PiiChunkRange[] = [];

  // Stream AI response
  const result = await streamText({
    model: openai("gpt-4.1-mini"),
    messages: await convertToModelMessages(normalizedMessages),
    system: SYSTEM_PROMPT,
  });

  // Create stream with PII detection
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const reader = result.toUIMessageStream().getReader();
      const piiBuffer = createPiiBuffer((ranges) => {
        // Collect ranges for DB persistence
        collectedPiiRanges.push(...ranges);
        writer.write({
          type: "data-pii",
          id: "pii-chunks",
          data: { chunks: ranges },
        });
      });

      let finishChunk: Parameters<typeof writer.write>[0] | null = null;
      let fullText = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          // Buffer text for PII detection
          if (value.type === "text-delta") {
            piiBuffer.add(value.delta ?? "");
            fullText += value.delta ?? "";
          }

          // Defer finish until PII detection completes
          if (value.type === "finish") {
            finishChunk = value;
            continue;
          }

          writer.write(value);
        }

        // Flush remaining buffer and wait for detection
        await piiBuffer.finish();

        // Save assistant message with PII ranges after stream completes
        if (conversationId) {
          await saveMessage(
            conversationId,
            user.id,
            "assistant",
            fullText,
            collectedPiiRanges
          );
        }

        if (finishChunk) {
          writer.write(finishChunk);
        }
      } finally {
        reader.releaseLock();
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}

/**
 * Extracts text content from a UI message
 * Handles both UIMessage format (with parts) and simple format (with content)
 */
function extractTextContent(
  message: UIMessage | { role: string; content: string }
): string {
  // Handle simple message format with content string
  if ("content" in message && typeof message.content === "string") {
    return message.content;
  }

  // Handle UIMessage format with parts array
  if ("parts" in message && Array.isArray(message.parts)) {
    return message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("");
  }

  return "";
}
