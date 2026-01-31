import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/lib/stack";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const user = await stackServerApp.getUser({
      tokenStore: req,
      or: "throw",
    });

    const userConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, user.id))
      .orderBy(desc(conversations.updatedAt));

    return NextResponse.json({ conversations: userConversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return new Response("Unauthorized", { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await stackServerApp.getUser({
      tokenStore: req,
      or: "throw",
    });

    const body = await req.json();
    const { title } = body;

    const [conversation] = await db
      .insert(conversations)
      .values({
        userId: user.id,
        title: title || "New Conversation",
      })
      .returning();

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Error creating conversation:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('relation "conversations" does not exist')) {
      return NextResponse.json(
        { error: "Database tables not yet created. Run migrations first." },
        { status: 500 }
      );
    }
    return new Response("Unauthorized", { status: 401 });
  }
}
