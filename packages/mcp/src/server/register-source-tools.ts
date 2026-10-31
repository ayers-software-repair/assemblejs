// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { applySourceChanges } from "../author/apply-source-changes.js";
import { readSourceVersion } from "../author/read-source-version.js";
import { readSource } from "../author/read-source.js";
import type { ProjectRoot } from "../root/project-root.js";
import { answering } from "./answering.js";
import { notifyAuthoring } from "./notify-authoring.js";

/** Shared source reads and expected-base edits; consent remains the client's responsibility. */
export function registerSourceTools(server: McpServer, root: ProjectRoot): void {
  const path = z
    .string()
    .min(1)
    .max(256)
    .describe("a regular file under src/ or assemblejs.config.ts");
  server.registerTool(
    "read_source_version",
    {
      title: "Read project source version",
      description:
        "Reads the build fingerprint of package.json, assemblejs.config.ts and src/ paths and bytes without building, executing project code or returning their contents. It excludes dependencies, environment and remote servers. An observed identity, not an atomic snapshot or proof of check/build/behavior success.",
      inputSchema: {},
    },
    answering(() => readSourceVersion(root)),
  );
  server.registerTool(
    "read_source",
    {
      title: "Read project source",
      description:
        "Reads actual confined UTF-8 source, limited to 65536 bytes. Refuses linked paths and generated or host metadata. Does not execute source.",
      inputSchema: { path },
    },
    answering(({ path }) => readSource(root, path)),
  );
  server.registerTool(
    "apply_source_changes",
    {
      title: "Apply reviewed source changes",
      description:
        "Writes exact supplied UTF-8 changes after checking every expected base. Null before requires an absent file. Client must obtain approval in approval mode before calling. Refuses observed stale sources; no multi-file transaction or hostile-filesystem compare-and-swap guarantee. Reports completed and attempted paths on failure. Run check and verify the actual preview afterward.",
      inputSchema: {
        changes: z
          .array(
            z.object({
              path,
              before: z.string().max(65536).nullable(),
              after: z.string().max(65536),
            }),
          )
          .min(1)
          .max(32)
          .describe(
            "reviewed additions/replacements; at most 65536 bytes per value and 131072 bytes in total",
          ),
      },
    },
    answering(({ changes }) => notifyAuthoring(server, applySourceChanges(root, changes))),
  );
}
