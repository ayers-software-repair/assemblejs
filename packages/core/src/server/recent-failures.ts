// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { LogLine } from "../failure/log-line.js";

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
      lines.push(line);
      if (lines.length > limit) lines.shift();
    },
    list: () => [...lines],
  };
}
