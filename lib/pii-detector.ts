import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { PiiChunkRange } from "./ai-types";

// Configuration
const CONFIG = {
  model: "gpt-4.1-nano",
  minBufferSize: 200,
  maxBufferSize: 1200,
  sentenceEndPattern: /[.!?\n]\s*$/,
} as const;

// Schema for PII detection response
const piiSchema = z.object({
  piiItems: z.array(
    z.object({
      text: z.string().describe("The exact PII text found"),
      type: z
        .enum([
          "name",
          "phone",
          "email",
          "address",
          "id_number",
          "account_number",
          "credit_card",
          "api_key",
          "other_pii",
        ])
        .describe("Type of PII"),
    })
  ),
});

const PII_DETECTION_PROMPT = `You are a PII (Personally Identifiable Information) detector for data protection.

WHAT TO DETECT:
- Personal names (real people's names like "Ivan", "John Smith")
- Phone numbers
- Email addresses
- Physical addresses (streets, cities, coordinates)
- ID numbers, account numbers

WHAT TO EXCLUDE:
- Fictional character names (Harry Potter, Hermione, Frodo, etc.)
- Famous historical figures used in educational context
- Brand names or company names

Analyze this text and return any PII found:

"""
{TEXT}
"""`;

/**
 * Finds all occurrences of a substring in text
 */
function findAllOccurrences(text: string, substring: string): number[] {
  const positions: number[] = [];
  let pos = 0;
  const lowerText = text.toLowerCase();
  const lowerSub = substring.toLowerCase();

  while ((pos = lowerText.indexOf(lowerSub, pos)) !== -1) {
    positions.push(pos);
    pos += 1;
  }

  return positions;
}

/**
 * Merges overlapping or adjacent ranges
 */
function mergeRanges(ranges: PiiChunkRange[]): PiiChunkRange[] {
  if (ranges.length === 0) return [];

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: PiiChunkRange[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    // Merge if overlapping or adjacent (within 3 chars for punctuation)
    if (current.start <= last.end + 3) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push(current);
    }
  }

  return merged;
}

/**
 * Detects PII in text using AI and returns character ranges
 */
export async function detectPii(
  text: string,
  baseOffset = 0
): Promise<PiiChunkRange[]> {
  if (!text.trim()) return [];

  try {
    const { object } = await generateObject({
      model: openai(CONFIG.model),
      schema: piiSchema,
      temperature: 0,
      prompt: PII_DETECTION_PROMPT.replace("{TEXT}", text),
    });

    if (!object.piiItems.length) return [];

    // Convert detected PII text to character ranges
    const ranges: PiiChunkRange[] = [];

    for (const item of object.piiItems) {
      const positions = findAllOccurrences(text, item.text);

      for (const pos of positions) {
        ranges.push({
          start: baseOffset + pos,
          end: baseOffset + pos + item.text.length,
          isPii: true,
        });
      }
    }

    return mergeRanges(ranges);
  } catch (error) {
    console.error("PII detection failed:", error);
    return [];
  }
}

/**
 * Creates a PII detection buffer manager for streaming text
 * Uses sentence boundaries for more accurate detection
 */
export function createPiiBuffer(onDetected: (ranges: PiiChunkRange[]) => void) {
  let fullText = "";
  let processedUpTo = 0;
  let allRanges: PiiChunkRange[] = [];
  const pendingTasks: Promise<void>[] = [];

  const findSentenceBoundary = (text: string, minPos: number): number => {
    // Look for sentence-ending punctuation after minPos
    for (let i = minPos; i < text.length; i++) {
      if (/[.!?\n]/.test(text[i]) && (i + 1 >= text.length || /\s/.test(text[i + 1]))) {
        return i + 1;
      }
    }
    return -1;
  };

  const processChunk = async (text: string, offset: number) => {
    const detected = await detectPii(text, offset);
    if (detected.length > 0) {
      // Merge new ranges with existing, avoiding duplicates
      const newRanges = detected.filter(
        (newRange) =>
          !allRanges.some(
            (existing) =>
              existing.start === newRange.start && existing.end === newRange.end
          )
      );

      if (newRanges.length > 0) {
        allRanges = mergeRanges([...allRanges, ...newRanges]);
        onDetected(allRanges);
      }
    }
  };

  const tryFlush = () => {
    const unprocessedLength = fullText.length - processedUpTo;

    // Only process if we have enough content
    if (unprocessedLength < CONFIG.minBufferSize) return;

    // Find a good sentence boundary to split at
    const searchStart = processedUpTo + CONFIG.minBufferSize;
    let boundary = findSentenceBoundary(fullText, searchStart);

    // If no boundary found but we have too much content, force a split
    if (boundary === -1 && unprocessedLength >= CONFIG.maxBufferSize) {
      // Find the last space as fallback
      const searchEnd = processedUpTo + CONFIG.maxBufferSize;
      for (let i = searchEnd; i > searchStart; i--) {
        if (/\s/.test(fullText[i])) {
          boundary = i + 1;
          break;
        }
      }
      // Last resort: just use maxBufferSize
      if (boundary === -1) {
        boundary = processedUpTo + CONFIG.maxBufferSize;
      }
    }

    if (boundary !== -1 && boundary > processedUpTo) {
      const chunk = fullText.slice(processedUpTo, boundary);
      const offset = processedUpTo;
      processedUpTo = boundary;

      const task = processChunk(chunk, offset);
      pendingTasks.push(task);
    }
  };

  return {
    add(text: string) {
      fullText += text;
      tryFlush();
    },

    async finish() {
      // Process any remaining text
      if (processedUpTo < fullText.length) {
        const remaining = fullText.slice(processedUpTo);
        if (remaining.trim()) {
          const task = processChunk(remaining, processedUpTo);
          pendingTasks.push(task);
        }
      }

      await Promise.allSettled(pendingTasks);
      return allRanges;
    },

    get ranges() {
      return allRanges;
    },

    get text() {
      return fullText;
    },
  };
}
