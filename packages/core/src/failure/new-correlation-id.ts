// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";

/**
 * The one thing a visitor is ever told about a failure, and the one thing that finds it in a
 * log. Short enough to read down a phone, long enough not to collide within a log's lifetime.
 */
export function newCorrelationId(): string {
  return randomUUID().slice(0, 8);
}
