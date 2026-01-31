import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { stackServerApp } from "@/lib/stack";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const TITLE_SYSTEM_PROMPT = `Generate a short, concise title (3-6 words) for this conversation based on the user's first message. 
Do not use quotes or special formatting. Just output the title directly.
Make it descriptive but brief.`;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;

  // Authenticate user
  const user = await stackServerApp
    .getUser({ tokenStore: req, or: "throw" })
    .catch(() => null);

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Parse request body
  const body = await req.json();
  const { firstMessage } = body as { firstMessage: string };

  if (!firstMessage) {
    return new Response("Missing firstMessage", { status: 400 });
  }

  // Verify conversation exists and belongs to user
  const [conv] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, user.id)
      )
    );

  if (!conv) {
    return new Response("Conversation not found", { status: 404 });
  }

  // Skip if title already generated (not default)
  if (conv.title && conv.title !== "New Conversation") {
    return new Response(JSON.stringify({ title: conv.title }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Stream title generation
  const result = streamText({
    model: openai("gpt-4.1-mini"),
    system: TITLE_SYSTEM_PROMPT,
    prompt: `User's first message: "${firstMessage}"`,
  });

  const response = result.toTextStreamResponse();
  const reader = response.body?.getReader();

  if (!reader) {
    return new Response("Stream error", { status: 500 });
  }

  // Create a ReadableStream that captures the title and saves it at the end
  let fullTitle = "";

  const readable = new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await reader.read();
        
        if (done) {
          // Save final title to database
          if (fullTitle.trim()) {
            await db
              .update(conversations)
              .set({
                title: fullTitle.trim().slice(0, 100),
                updatedAt: new Date(),
              })
              .where(eq(conversations.id, conversationId));
          }
          controller.close();
          return;
        }

        // Accumulate the title text
        const text = new TextDecoder().decode(value);
        fullTitle += text;
        
        controller.enqueue(value);
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Conversation-Id": conversationId,
    },
  });
}
