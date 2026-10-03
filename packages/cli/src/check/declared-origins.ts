// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { LiteralValue } from "./literal-value.js";
import { readLiterals } from "./read-literals.js";

/**
 * Every remote origin a project's config declares as a literal, read without running it. A
 * remote declared some other way is not seen here, and boot still holds every placement to the
 * remotes it really declares.
 */
export function declaredOrigins(source: string): ReadonlySet<string> {
  const found = new Set<string>();
  const visit = (value: LiteralValue): void => {
    if (value === null || typeof value === "string") return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    for (const [key, entry] of Object.entries(value as Record<string, LiteralValue>)) {
      if (key === "origin" && typeof entry === "string") found.add(entry);
      visit(entry);
    }
  };
  for (const literal of readLiterals(source)) visit(literal);
  return found;
}
