// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What a template engine said of a template it could not read, on one line: its message up to
 * the first blank line, which is where an engine starts advising about options this build does
 * not expose, without the lines that only draw a caret or a rule under an excerpt, each line
 * trimmed and joined by a space. An error with no message says so.
 */
export function engineSaid(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lines: string[] = [];
  for (const line of message.split("\n")) {
    const text = line.trim();
    if (text === "") break;
    if (/^[-^~\s]+$/.test(text)) continue;
    lines.push(text);
  }
  return lines.length === 0 ? "the engine gave no message" : lines.join(" ");
}
