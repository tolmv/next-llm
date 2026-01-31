import { atom } from "jotai";
import type { ChatUIMessage } from "@/lib/ai-types";

export const messagesAtom = atom<ChatUIMessage[]>([]);
export const inputAtom = atom("");
export const isStreamingAtom = atom(false);

// Pending initial message for new conversations (avoids URL-based race conditions)
export const pendingInitialMessageAtom = atom<string | null>(null);

// Streaming titles state: Map of conversationId -> streaming title text
export const streamingTitlesAtom = atom<Map<string, string>>(new Map());

// Helper atom to update a single streaming title
export const updateStreamingTitleAtom = atom(
  null,
  (get, set, { conversationId, title }: { conversationId: string; title: string }) => {
    const currentMap = get(streamingTitlesAtom);
    const newMap = new Map(currentMap);
    newMap.set(conversationId, title);
    set(streamingTitlesAtom, newMap);
  }
);

// Helper atom to clear a streaming title (when done)
export const clearStreamingTitleAtom = atom(
  null,
  (get, set, conversationId: string) => {
    const currentMap = get(streamingTitlesAtom);
    const newMap = new Map(currentMap);
    newMap.delete(conversationId);
    set(streamingTitlesAtom, newMap);
  }
);
