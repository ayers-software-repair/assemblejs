// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
/** Requests a server-priced quantity; a response for a different item is never an estimate. */
export async function requestEstimate(
  sku: string,
  quantity: number,
  note: string,
  signal: AbortSignal,
): Promise<{
  readonly quantity: number;
  readonly cents: number;
  readonly problems: readonly string[];
}> {
  const response = await fetch("/api/quote", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lines: [{ sku, quantity, note }] }),
    signal,
  });
  if (!response.ok) throw new Error(`Quote request failed (${response.status}).`);
  const body: unknown = await response.json();
  if (
    typeof body !== "object" ||
    body === null ||
    !("cents" in body) ||
    !("lines" in body) ||
    !("problems" in body)
  )
    throw new Error("The quote service returned an invalid estimate.");
  const { cents, lines, problems } = body;
  if (
    typeof cents !== "number" ||
    !Number.isSafeInteger(cents) ||
    cents < 0 ||
    !Array.isArray(lines) ||
    !Array.isArray(problems)
  )
    throw new Error("The quote service returned an invalid estimate.");
  const messages = problems.filter(
    (problem: unknown): problem is string => typeof problem === "string",
  );
  if (messages.length !== problems.length)
    throw new Error("The quote service returned an invalid estimate.");
  if (lines.length === 0 && messages.length > 0) throw new Error(messages.join(" "));
  if (lines.length !== 1) throw new Error("The quote service returned an invalid estimate.");
  const line: unknown = lines[0];
  if (
    typeof line !== "object" ||
    line === null ||
    !("sku" in line) ||
    !("quantity" in line) ||
    !("cents" in line) ||
    line.sku !== sku ||
    line.quantity !== quantity ||
    typeof line.cents !== "number" ||
    !Number.isSafeInteger(line.cents) ||
    line.cents < 0 ||
    cents !== line.cents * quantity
  )
    throw new Error("The quote service returned an invalid estimate.");
  return { quantity, cents, problems: messages };
}
