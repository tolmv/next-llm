import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { db } from "@/db";
import { chatMessages } from "@/db/schema";
import { stackServerApp } from "@/lib/stack";

type ChatRequest = {
  messages: UIMessage[];
};

export async function POST(req: Request) {
  const body = (await req.json()) as ChatRequest;
  if (!body.messages || body.messages.length === 0) {
    return new Response("Missing messages", { status: 400 });
  }
  const lastMessage = body.messages?.[body.messages.length - 1];

  if (lastMessage?.role === "user") {
    let userId: string | null = null;
    try {
      const user = await stackServerApp.getUser({
        tokenStore: req,
        or: "throw",
      });
      userId = user?.id ?? null;
    } catch {
      return new Response("Unauthorized", { status: 401 });
    }
    const textContent = lastMessage.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("");
    try {
      await db.insert(chatMessages).values({
        userId,
        role: lastMessage.role,
        content: textContent,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('relation "chat_messages" does not exist')) {
        throw error;
      }
      console.warn(
        'Skipping chat_messages insert because the table is missing.',
      );
    }
  }

  const modelMessages = await convertToModelMessages(body.messages);
  const result = await streamText({
    model: openai("gpt-4o-mini"),
    messages: modelMessages,
    system:
      "You are a helpful assistant. Be concise, decisive, and provide clear reasoning.",
  });

  return result.toUIMessageStreamResponse();
}
