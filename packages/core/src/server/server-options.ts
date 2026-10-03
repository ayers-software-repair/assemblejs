// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ApiDefinition } from "../api/api-definition.js";
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import type { Config } from "../config/config.js";

/** Everything a server is built from. */
export interface ServerOptions {
  readonly config: Config;
  readonly assemblies: readonly AssemblyDefinition[];
  /** Routes that serve data to anyone, outside the assembly contract. */
  readonly apis?: readonly ApiDefinition[];
  /** The version of this build's output, reported in every manifest. */
  readonly version?: string;
  /** How many assemblies deep composition may go. */
  readonly maxDepth?: number;
}
