// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Authenticate } from "../access/authenticate.js";
import type { RemoteDefinition } from "../remote/remote-definition.js";
import type { PageBudgets } from "./page-budgets.js";

/**
 * What `assemblejs.config.ts` declares: policy only, the things that are a decision about this
 * project rather than a fact about where it runs. Where it runs (host, port, credentials) comes
 * from the process environment, never from a file that is built into the server.
 */
export interface ProjectConfig {
  /** The other servers this project composes assemblies from. */
  readonly remotes?: readonly RemoteDefinition[];
  /** The product's own access check, for anything basic credentials cannot express. */
  readonly authenticate?: Authenticate;
  /** Paths that need no credentials: exact, or a prefix when the entry ends in `/*`. */
  readonly publicRoutes?: readonly string[];
  /** Replaces the default content security policy on every html answer. */
  readonly contentSecurityPolicy?: string;
  /** What each page may send a visitor, gzipped, by part. Read by `perf`, never by the server. */
  readonly budgets?: PageBudgets;
}
