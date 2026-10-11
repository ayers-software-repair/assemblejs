// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { LogLine } from "../failure/log-line.js";

/**
 * The line logged when the product's own check throws: what it threw, against the id whoever
 * was refused is told. The check's message reaches the log and no response.
 */
export function checkThrew(correlationId: string, error: unknown): LogLine {
  return {
    correlationId,
    message: `the authenticate check threw: ${error instanceof Error ? error.message : String(error)}`,
    stack: error instanceof Error ? error.stack : undefined,
  };
}
