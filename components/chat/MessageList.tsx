import type { ReactNode } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Spoiler } from "spoiled";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatUIMessage, PiiChunkRange } from "@/lib/ai-types";

const getMessageText = (message: ChatUIMessage): string => {
  if (!message.parts || message.parts.length === 0) {
    const content = "content" in message ? message.content : "";
    return typeof content === "string" ? content : "";
  }

  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
};

const getPiiRanges = (message: ChatUIMessage): PiiChunkRange[] => {
  if (!message.parts || message.parts.length === 0) return [];

  return message.parts
    .filter((part) => part.type === "data-pii")
    .flatMap((part) => part.data.chunks);
};

const normalizeRanges = (
  text: string,
  ranges: PiiChunkRange[]
): PiiChunkRange[] => {
  if (!text || ranges.length === 0) return [];

  const clamped = ranges
    .filter((range) => range.isPii)
    .map((range) => {
      const start = Math.max(0, Math.min(range.start, text.length));
      const end = Math.max(0, Math.min(range.end, text.length));
      return start < end ? { ...range, start, end } : null;
    })
    .filter((range): range is PiiChunkRange => range !== null)
    .sort((a, b) => a.start - b.start);

  const merged: PiiChunkRange[] = [];
  for (const range of clamped) {
    const last = merged[merged.length - 1];
    if (!last || range.start > last.end) {
      merged.push({ ...range });
      continue;
    }
    last.end = Math.max(last.end, range.end);
  }

  return merged;
};

// Create markdown components with PII spoiler support
const createMarkdownComponents = (
  fullText: string,
  piiRanges: PiiChunkRange[]
): Components => {
  // Helper to process children and apply spoilers to text nodes
  const processChildren = (children: ReactNode): ReactNode => {
    if (typeof children === "string") {
      // Find PII in this text segment
      const matchingRanges = piiRanges.filter((range) => {
        const piiText = fullText.slice(range.start, range.end);
        return children.includes(piiText);
      });

      if (matchingRanges.length > 0) {
        let result: ReactNode[] = [];
        let remaining = children;
        let keyIdx = 0;

        for (const range of matchingRanges) {
          const piiText = fullText.slice(range.start, range.end);
          const idx = remaining.indexOf(piiText);
          if (idx === -1) continue;

          if (idx > 0) {
            result.push(remaining.slice(0, idx));
          }
          result.push(
            <Spoiler
              key={`pii-${range.start}-${range.end}-${keyIdx++}`}
              revealOn="click"
            >
              {piiText}
            </Spoiler>
          );
          remaining = remaining.slice(idx + piiText.length);
        }

        if (remaining) {
          result.push(remaining);
        }

        return result.length > 0 ? <>{result}</> : children;
      }
      return children;
    }

    if (Array.isArray(children)) {
      return children.map((child, i) => {
        const processed = processChildren(child);
        if (typeof processed === "string") return processed;
        return <span key={i}>{processed}</span>;
      });
    }

    return children;
  };

  return {
    p: ({ children, ...props }) => <p {...props}>{processChildren(children)}</p>,
    li: ({ children, ...props }) => <li {...props}>{processChildren(children)}</li>,
    strong: ({ children, ...props }) => <strong {...props}>{processChildren(children)}</strong>,
    em: ({ children, ...props }) => <em {...props}>{processChildren(children)}</em>,
    h1: ({ children, ...props }) => <h1 {...props}>{processChildren(children)}</h1>,
    h2: ({ children, ...props }) => <h2 {...props}>{processChildren(children)}</h2>,
    h3: ({ children, ...props }) => <h3 {...props}>{processChildren(children)}</h3>,
    h4: ({ children, ...props }) => <h4 {...props}>{processChildren(children)}</h4>,
    h5: ({ children, ...props }) => <h5 {...props}>{processChildren(children)}</h5>,
    h6: ({ children, ...props }) => <h6 {...props}>{processChildren(children)}</h6>,
    table: ({ children, ...props }) => <table {...props}>{children}</table>,
    thead: ({ children, ...props }) => <thead {...props}>{children}</thead>,
    tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
    tr: ({ children, ...props }) => <tr {...props}>{children}</tr>,
    td: ({ children, ...props }) => <td {...props}>{processChildren(children)}</td>,
    th: ({ children, ...props }) => <th {...props}>{processChildren(children)}</th>,
    blockquote: ({ children, ...props }) => <blockquote {...props}>{processChildren(children)}</blockquote>,
    a: ({ children, ...props }) => <a {...props}>{processChildren(children)}</a>,
  };
};

export function MessageList({ messages }: { messages: ChatUIMessage[] }) {
  if (messages.length === 0) {
    return (
      <Card className="border-dashed text-center">
        <CardContent className="text-sm text-muted-foreground">
          Start the conversation with a prompt. The assistant will stream
          replies.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const text = getMessageText(message);
        const piiRanges = normalizeRanges(text, getPiiRanges(message));
        const isUser = message.role === "user";

        return (
          <div
            key={message.id}
            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
          >
            <Card
              className={`max-w-[80%] ${isUser ? "bg-zinc-50" : "bg-white"}`}
            >
              <CardContent className="rounded-full">
                {text ? (
                  <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={createMarkdownComponents(text, piiRanges)}
                    >
                      {text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="space-y-2 min-w-[200px]">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
