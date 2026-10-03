// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { LogLine } from "../failure/log-line.js";

/**
 * Where a server writes what a visitor was not told, unless it was given somewhere else: one JSON
 * object per line on standard error, which is what every process supervisor and log shipper
 * already reads.
 */
export function writeLogLine(line: LogLine): void {
  process.stderr.write(`${JSON.stringify({ level: "error", ...line })}\n`);
}
