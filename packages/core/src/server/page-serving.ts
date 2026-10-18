// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import type { ContentCache } from "../compose/content-cache.js";
import type { Fetch } from "../compose/fetch.js";
import type { Limits } from "../compose/limits.js";
import type { LogLine } from "../failure/log-line.js";
import type { RemoteDefinition } from "../remote/remote-definition.js";
import type { RemoteTransport } from "../remote/remote-transport.js";
import type { AdmitVisitor } from "./admit-visitor.js";

/** What every page of a server is composed and answered with, its not-found page's included. */
export interface PageServing {
  readonly assemblies: ReadonlyMap<string, AssemblyDefinition>;
  readonly local: Fetch;
  /** The server's bounds, the same its own assemblies' children are composed under. */
  readonly limits: Limits;
  readonly remote: RemoteTransport;
  readonly remotes: readonly RemoteDefinition[];
  readonly cache: ContentCache;
  /** Stylesheets every page links before any assembly's, by url. */
  readonly styles?: readonly string[];
  readonly log: (line: LogLine) => void;
  /**
   * In development, this server's boot: every page links the script that reloads it, carrying
   * the boot of the server that rendered it.
   */
  readonly reload?: string;
  /** Whether the visitor asking may be shown each assembly the page places. Everyone, if absent. */
  readonly admit?: AdmitVisitor;
  /** Whether every page carries its outline. Only `true` turns it on. */
  readonly outline?: boolean;
}
