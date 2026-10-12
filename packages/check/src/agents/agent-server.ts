// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * A project's agent surface as the project meets it: the name it is registered under and
 * announces itself by, the package that carries it, its entry point from the project's root,
 * which node runs on every platform with no shell and nothing fetched, and the command line it
 * is built on, one exact version of it, which a project installs beside it.
 */
export const AGENT_SERVER = {
  name: "assemblejs",
  package: "@assemblejs/mcp",
  path: "node_modules/@assemblejs/mcp/dist/bin.js",
  commandLine: "@assemblejs/cli",
} as const;
