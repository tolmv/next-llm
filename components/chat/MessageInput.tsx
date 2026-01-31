import type { ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim().length > 0) {
        const form = e.currentTarget.form;
        if (form) {
          form.requestSubmit();
        }
      }
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
    >
      <Textarea
        value={input}
        onChange={onInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask the assistant to review an architecture, design a component, or debug a bug."
        rows={4}
        className="resize-none"
      />
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>Press Enter to send, Shift+Enter for new line</span>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onStop}
            >
              Stop
            </Button>
          ) : null}
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || input.trim().length === 0}
          >
            Send
          </Button>
        </div>
      </div>
    </form>
  );
}
