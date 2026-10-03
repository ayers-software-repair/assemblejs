// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { RemoteDefinition } from "../remote/remote-definition.js";

/**
 * What `assemblejs.config.ts` declares: policy only, the things that are a decision about this
 * project rather than a fact about where it runs. Where it runs (host, port, credentials) comes
 * from the process environment, never from a file that is built into the server.
 */
export interface ProjectConfig {
  /** The other servers this project composes assemblies from. */
  readonly remotes?: readonly RemoteDefinition[];
}
