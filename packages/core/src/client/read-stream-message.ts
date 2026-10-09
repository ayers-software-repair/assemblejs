// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { StreamMessage } from "../island/stream-message.js";

/**
 * Reads one message from a page's stream, or undefined for anything that is not one: text that is
 * not JSON, a topic that is not a non-empty string, no payload, or an address that is not a name.
 * The stream is the page's own server, and a message that does not parse still reaches nothing.
 */
export function readStreamMessage(data: string): StreamMessage | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return undefined;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return undefined;
  const message = parsed as Record<string, unknown>;
  if (typeof message["topic"] !== "string" || message["topic"] === "") return undefined;
  if (!("payload" in message)) return undefined;
  const to = message["to"];
  if (to === undefined) return message as unknown as StreamMessage;
  const named =
    typeof to === "object" && to !== null && typeof (to as { name?: unknown }).name === "string";
  return named ? (message as unknown as StreamMessage) : undefined;
}
