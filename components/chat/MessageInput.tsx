import type { ChangeEvent, FormEvent } from "react";

type MessageInputProps = {
  input: string;
  isLoading: boolean;
  onInputChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStop: () => void;
};

export function MessageInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
  onStop,
}: MessageInputProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
    >
      <textarea
        value={input}
        onChange={onInputChange}
        placeholder="Ask the assistant to review an architecture, design a component, or debug a bug."
        rows={4}
        className="w-full resize-none rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-400"
      />
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>Streaming is enabled via Vercel AI SDK.</span>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              className="rounded-full border border-zinc-200 px-3 py-1 text-zinc-600 hover:border-zinc-300"
            >
              Stop
            </button>
          ) : null}
          <button
            type="submit"
            disabled={isLoading || input.trim().length === 0}
            className="rounded-full bg-zinc-900 px-4 py-1 text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            Send
          </button>
        </div>
      </div>
    </form>
  );
}
