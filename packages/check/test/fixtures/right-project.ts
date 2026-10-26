// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { agentFiles } from "@asmjs/check";

/**
 * A project that is right, as far as anything beneath the command line reads one: a manifest
 * with the agent surface among its development dependencies, a server file, one assembly on
 * one page, and the agent files this version writes. What `new` itself writes is the command
 * line's, and its own tests hold that to these checks.
 */
export function rightProject(name: string): Readonly<Record<string, string>> {
  return {
    "package.json": `${JSON.stringify(
      {
        name,
        private: true,
        type: "module",
        devDependencies: { "@asmjs/cli": "^1.0.0", "@asmjs/mcp": "^1.0.0" },
      },
      null,
      2,
    )}\n`,
    "src/server.ts": "",
    "src/assemblies/hello/hello.html": "<p>hi</p>\n",
    "src/pages/home/home.html": '<body><assembly name="hello"></assembly></body>\n',
    ...agentFiles(name).files,
  };
}
