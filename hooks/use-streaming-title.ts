"use client";

import { useSetAtom } from "jotai";
import { useCallback } from "react";
import {
  updateStreamingTitleAtom,
  clearStreamingTitleAtom,
} from "@/state/chat";

export function useStreamingTitle() {
  const updateTitle = useSetAtom(updateStreamingTitleAtom);
  const clearTitle = useSetAtom(clearStreamingTitleAtom);

  const generateTitle = useCallback(
    async (conversationId: string, firstMessage: string) => {
      try {
        const response = await fetch(
          `/api/conversations/${conversationId}/title`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstMessage }),
          }
        );

        if (!response.ok) {
          console.error("Failed to generate title:", response.statusText);
          return;
        }

        // Check if it's a JSON response (title already exists)
        const contentType = response.headers.get("Content-Type");
        if (contentType?.includes("application/json")) {
          const data = await response.json();
          updateTitle({ conversationId, title: data.title });
          // Clear after a short delay to allow UI update
          setTimeout(() => clearTitle(conversationId), 100);
          return data.title;
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let fullTitle = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullTitle += chunk;
          updateTitle({ conversationId, title: fullTitle });
        }

        // Clear streaming state after completion
        setTimeout(() => clearTitle(conversationId), 100);
        return fullTitle;
      } catch (error) {
        console.error("Error generating title:", error);
        clearTitle(conversationId);
      }
    },
    [updateTitle, clearTitle]
  );

  return { generateTitle };
}
