import type { UIMessage } from "ai";

export type PiiChunkRange = {
  start: number;
  end: number;
  isPii: boolean;
};

export type ChatUIMessage = UIMessage<
  never,
  {
    pii: {
      chunks: PiiChunkRange[];
    };
  }
>;
