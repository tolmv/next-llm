import { db } from "@/db";
import { chatMessages, conversations, type MessageMetadata } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { PiiChunkRange } from "@/lib/ai-types";

/**
 * Creates a new conversation for a user
 */
export async function createConversation(userId: string) {
  try {
    const [conversation] = await db
      .insert(conversations)
      .values({ userId, title: "New Conversation" })
      .returning();
    return conversation;
  } catch (error) {
    if (isTableMissing(error, "conversations")) {
      console.warn("Skipping: conversations table missing");
      return null;
    }
    throw error;
  }
}

/**
 * Saves a chat message to the database
 */
export async function saveMessage(
  conversationId: string,
  userId: string,
  role: "user" | "assistant",
  content: string,
  piiRanges?: PiiChunkRange[]
) {
  try {
    const metadata: MessageMetadata | undefined = piiRanges?.length
      ? { piiRanges }
      : undefined;

    await db.insert(chatMessages).values({
      conversationId,
      userId,
      role,
      content,
      metadata,
    });
    await updateConversationTimestamp(conversationId);
  } catch (error) {
    if (isTableMissing(error, "chat_messages")) {
      console.warn("Skipping: chat_messages table missing");
      return;
    }
    throw error;
  }
}

/**
 * Updates conversation timestamp and optionally generates title
 */
export async function updateConversationWithTitle(
  conversationId: string,
  firstUserMessage?: string
) {
  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (!conv) return;

    const updates: { title?: string; updatedAt: Date } = {
      updatedAt: new Date(),
    };

    // Auto-generate title from first message if still default
    if (conv.title === "New Conversation" && firstUserMessage) {
      const truncated = firstUserMessage.slice(0, 50);
      updates.title = truncated + (firstUserMessage.length > 50 ? "..." : "");
    }

    await db
      .update(conversations)
      .set(updates)
      .where(eq(conversations.id, conversationId));
  } catch (error) {
    console.error("Failed to update conversation:", error);
  }
}

/**
 * Updates conversation timestamp
 */
async function updateConversationTimestamp(conversationId: string) {
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));
}

/**
 * Checks if error is due to missing table
 */
function isTableMissing(error: unknown, tableName: string): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes(`relation "${tableName}" does not exist`);
}
