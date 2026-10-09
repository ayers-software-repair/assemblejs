// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AuthConfig } from "../config/auth-config.js";
import type { Authenticate } from "./authenticate.js";

/** Everything the one decision is made from. With neither control on, every request proceeds. */
export interface AccessPolicy {
  readonly basic: AuthConfig | undefined;
  readonly authenticate: Authenticate | undefined;
  /** Paths that always proceed: exact, or a prefix when the entry ends in `/*`. */
  readonly publicRoutes: readonly string[];
}
