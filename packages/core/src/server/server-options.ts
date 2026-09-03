// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import type { Config } from "../config/config.js";

/** Everything a server is built from. */
export interface ServerOptions {
  readonly config: Config;
  readonly assemblies: readonly AssemblyDefinition[];
  /** The version of this build's output, reported in every manifest. */
  readonly version?: string;
  /** How many assemblies deep composition may go. */
  readonly maxDepth?: number;
}
