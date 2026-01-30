import type { UIMessage } from "ai";

const roleLabels: Record<UIMessage["role"], string> = {
  user: "You",
  assistant: "Assistant",
  system: "System",
};

const getMessageText = (message: UIMessage): string => {
  if (!message.parts || message.parts.length === 0) {
    const content = "content" in message ? message.content : "";
    return typeof content === "string" ? content : "";
  }

  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
};

export function MessageList({ messages }: { messages: UIMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500">
        Start the conversation with a prompt. The assistant will stream replies.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const text = getMessageText(message);
        return (
          <div
            key={message.id}
            className={`rounded-2xl border px-4 py-3 ${
              message.role === "user"
                ? "border-zinc-200 bg-zinc-50"
                : "border-zinc-100 bg-white"
            }`}
          >
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {roleLabels[message.role]}
            </div>
            <div className="whitespace-pre-wrap text-sm text-zinc-800">
              {text ? (
                text
              ) : (
                <span className="text-zinc-400">No text content.</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
