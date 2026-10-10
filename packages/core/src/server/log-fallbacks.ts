// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Diagnostic } from "../compose/diagnostic.js";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";

/**
 * Logs every placement that was answered by something other than its own content.
 *
 * A placement that fell back still served a page, so nothing else would ever say it failed. Its
 * envelope carries the failure's id; the line logged here is what that id finds. `where` says
 * what was being composed, `on page "/cart"` for one.
 */
export function logFallbacks(
  diagnostics: readonly Diagnostic[],
  where: string,
  log: (line: LogLine) => void,
): void {
  for (const diagnostic of diagnostics) {
    if (diagnostic.reason === undefined) continue;
    log({
      correlationId: diagnostic.correlationId ?? newCorrelationId(),
      message: `assembly "${diagnostic.name}" ${where} was answered by the ${diagnostic.source} after ${diagnostic.reason}`,
      stack: undefined,
    });
  }
}
