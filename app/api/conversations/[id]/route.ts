import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/lib/stack";
import { db } from "@/db";
import { conversations, chatMessages } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await stackServerApp.getUser({
      tokenStore: req,
      or: "throw",
    });

    const { id } = await params;

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, user.id)));

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, id))
      .orderBy(asc(chatMessages.createdAt));

    return NextResponse.json({ conversation, messages });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return new Response("Unauthorized", { status: 401 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await stackServerApp.getUser({
      tokenStore: req,
      or: "throw",
    });

    const { id } = await params;

    const result = await db
      .delete(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, user.id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return new Response("Unauthorized", { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await stackServerApp.getUser({
      tokenStore: req,
      or: "throw",
    });

    const { id } = await params;
    const body = await req.json();
    const { title } = body;

    const [updatedConversation] = await db
      .update(conversations)
      .set({ title, updatedAt: new Date() })
      .where(and(eq(conversations.id, id), eq(conversations.userId, user.id)))
      .returning();

    if (!updatedConversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ conversation: updatedConversation });
  } catch (error) {
    console.error("Error updating conversation:", error);
    return new Response("Unauthorized", { status: 401 });
  }
}
