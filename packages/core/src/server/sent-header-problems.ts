// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { validateHeaderValue } from "node:http";

/**
 * Everything wrong with the values a project gave this server to send as headers, found before
 * anything listens. Each is named as its author would name it, and one left out is not checked.
 *
 * The rule is the platform's own, asked of it rather than written again here: what it would
 * refuse to write when the answer is sent is refused now. A policy written over several lines
 * otherwise starts a server that answers every page with a 500.
 */
export function sentHeaderProblems(
  values: Readonly<Record<string, string | undefined>>,
): readonly string[] {
  const problems: string[] = [];
  for (const [what, value] of Object.entries(values)) {
    if (value === undefined) continue;
    try {
      validateHeaderValue("value", value);
    } catch {
      problems.push(
        `${what} holds a character no response header can carry, such as a line break; write it on one line`,
      );
    }
  }
  return problems;
}
