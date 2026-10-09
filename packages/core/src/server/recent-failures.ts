// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { LogLine } from "../failure/log-line.js";

const MAX_TEXT = 8 * 1024;

/**
 * The latest failures a process logged, the oldest dropped once there are `limit` of them, for
 * devtools to show in development without keeping a log of its own.
 */
export function recentFailures(limit = 50): {
  readonly record: (line: LogLine) => void;
  readonly list: () => readonly LogLine[];
} {
  const lines: LogLine[] = [];
  return {
    record: (line) => {
      // Each line bounded too, so fifty of them stay small whatever was thrown.
      lines.push({
        correlationId: line.correlationId,
        message: line.message.slice(0, MAX_TEXT),
        stack: line.stack?.slice(0, MAX_TEXT),
      });
      if (lines.length > limit) lines.shift();
    },
    list: () => [...lines],
  };
}
