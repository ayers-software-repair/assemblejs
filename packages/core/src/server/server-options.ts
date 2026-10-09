// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Authenticate } from "../access/authenticate.js";
import type { ApiDefinition } from "../api/api-definition.js";
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import type { Config } from "../config/config.js";
import type { Devtools } from "../devtools/devtools.js";
import type { LogLine } from "../failure/log-line.js";
import type { PageDefinition } from "../page/page-definition.js";
import type { RemoteDefinition } from "../remote/remote-definition.js";

/** Everything a server is built from. */
export interface ServerOptions {
  /** Read from the process environment when absent, and refused there if it is unreadable. */
  readonly config?: Config;
  readonly assemblies: readonly AssemblyDefinition[];
  /** Routes that serve data to anyone, outside the assembly contract. */
  readonly apis?: readonly ApiDefinition[];
  /** Routes that render a template which places assemblies. */
  readonly pages?: readonly PageDefinition[];
  /** The product's own access check. Not with basic credentials: one place decides. */
  readonly authenticate?: Authenticate;
  /** Paths that need no credentials: exact, or a prefix when the entry ends in `/*`. */
  readonly publicRoutes?: readonly string[];
  /** Replaces the default content security policy on every html answer. */
  readonly contentSecurityPolicy?: string;
  /** The other servers this one may compose from. None, unless declared. */
  readonly remotes?: readonly RemoteDefinition[];
  /** The directory a build wrote its browser files to, as an absolute path. */
  readonly assets?: string;
  /** The version of this build's output, reported in every manifest. */
  readonly version?: string;
  /** How many assemblies deep composition may go. */
  readonly maxDepth?: number;
  /** Where failures are logged, against the id the visitor was told. Standard error if absent. */
  readonly log?: (line: LogLine) => void;
  /** Read-only devtools, mounted under their prefix in development and ignored in production. */
  readonly devtools?: Devtools;
}
