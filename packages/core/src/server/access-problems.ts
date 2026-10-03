// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Authenticate } from "../access/authenticate.js";
import type { AuthConfig } from "../config/auth-config.js";

/**
 * Everything wrong with how access is decided, found before anything listens: two controls on at
 * once, which would be two places that decide and could disagree, and a public route that is not
 * a path, which would never match the request it was meant to let through.
 */
export function accessProblems(
  basic: AuthConfig | undefined,
  authenticate: Authenticate | undefined,
  publicRoutes: readonly string[],
): readonly string[] {
  const problems: string[] = [];
  if (basic !== undefined && authenticate !== undefined) {
    problems.push(
      "both basic credentials (ASSEMBLEJS_AUTH) and an authenticate check are on; one place decides, so turn one off",
    );
  }
  for (const route of publicRoutes) {
    if (!route.startsWith("/")) problems.push(`public route "${route}" does not start with "/"`);
  }
  return problems;
}
