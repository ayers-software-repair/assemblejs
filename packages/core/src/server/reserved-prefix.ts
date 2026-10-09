// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ASSEMBLY_ROUTE_PREFIX } from "../vocab/assembly-route-prefix.js";
import { FRAMEWORK_ROUTE_PREFIX } from "../vocab/framework-route-prefix.js";

const RESERVED = [ASSEMBLY_ROUTE_PREFIX, FRAMEWORK_ROUTE_PREFIX];

/**
 * The framework prefix a product route would land under, or undefined. Compared without case,
 * so a route that differs from a reserved one only in its capitals is refused rather than left
 * to depend on the router's case setting.
 */
export function reservedPrefix(path: string): string | undefined {
  const lower = path.toLowerCase();
  return RESERVED.find((prefix) => lower === prefix || lower.startsWith(`${prefix}/`));
}
