// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ApiDefinition } from "../api/api-definition.js";
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import type { Config } from "../config/config.js";
import type { LogLine } from "../failure/log-line.js";
import type { PageDefinition } from "../page/page-definition.js";

/** Everything a server is built from. */
export interface ServerOptions {
  /** Read from the process environment when absent, and refused there if it is unreadable. */
  readonly config?: Config;
  readonly assemblies: readonly AssemblyDefinition[];
  /** Routes that serve data to anyone, outside the assembly contract. */
  readonly apis?: readonly ApiDefinition[];
  /** Routes that render a template which places assemblies. */
  readonly pages?: readonly PageDefinition[];
  /** The directory a build wrote its browser files to, as an absolute path. */
  readonly assets?: string;
  /** The version of this build's output, reported in every manifest. */
  readonly version?: string;
  /** How many assemblies deep composition may go. */
  readonly maxDepth?: number;
  /** Where failures are logged, against the id the visitor was told. Standard error if absent. */
  readonly log?: (line: LogLine) => void;
}
