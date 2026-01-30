import { atom } from "jotai";
import type { UIMessage } from "ai";

export const messagesAtom = atom<UIMessage[]>([]);
export const inputAtom = atom("");
export const isStreamingAtom = atom(false);
