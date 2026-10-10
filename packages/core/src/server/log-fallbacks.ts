// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Diagnostic } from "../compose/diagnostic.js";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";

/**
 * Logs every placement that was answered by something other than its own content, at any depth:
 * a page's placements, and the children each of them placed.
 *
 * A placement that fell back still served a page, so nothing else would ever say it failed. Its
 * envelope carries the failure's id; the line logged here is what that id finds. The placements
 * a request refused for passing its limit share one id, and one line that says how many. `where` says
 * what was being composed, `on page "/cart"` for one, and a child's line also names each
 * assembly it sits inside.
 */
export function logFallbacks(
  diagnostics: readonly Diagnostic[],
  where: string,
  log: (line: LogLine) => void,
): void {
  for (const diagnostic of diagnostics) {
    if (diagnostic.refused !== undefined) {
      // The one account of every placement the request refused for passing its limit.
      log({
        correlationId: diagnostic.correlationId ?? newCorrelationId(),
        message: `${String(diagnostic.refused)} placements ${where} were refused after ${String(diagnostic.reason)}, the first of them "${diagnostic.name}"`,
        stack: undefined,
      });
    } else if (diagnostic.reason !== undefined) {
      log({
        correlationId: diagnostic.correlationId ?? newCorrelationId(),
        message: `assembly "${diagnostic.name}" ${where} was answered by the ${diagnostic.source} after ${diagnostic.reason}`,
        stack: undefined,
      });
    }
    if (diagnostic.children !== undefined) {
      logFallbacks(diagnostic.children, `${where}, inside "${diagnostic.name}"`, log);
    }
  }
}
