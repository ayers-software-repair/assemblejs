// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { LogLine } from "./log-line.js";

/**
 * The other half of a failure: everything the visitor was NOT told, kept for the log, keyed by
 * the id the visitor WAS told. This is what makes one failing assembly findable without guessing.
 */
export function describeFailure(correlationId: string, cause: unknown): LogLine {
  if (cause instanceof Error) {
    return { correlationId, message: cause.message, stack: cause.stack };
  }
  return { correlationId, message: String(cause), stack: undefined };
}
