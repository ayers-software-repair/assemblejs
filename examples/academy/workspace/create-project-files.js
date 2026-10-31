// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { callProjectTool } from "./call-project-tool.js";

/** Adapt explicit editor reads/saves to the same guarded source tools used by agents. */
export function createProjectFiles(client) {
  return {
    async readFile(path) {
      const answer = await callProjectTool(client, "read_source", { path });
      if (!answer.ok || answer.problems.length) throw new Error(JSON.stringify(answer));
      if (answer.result?.path !== path || typeof answer.result.contents !== "string")
        throw new Error("invalid source read acknowledgement");
      return answer.result.contents;
    },
    async writeFile(path, after, before) {
      const answer = await callProjectTool(client, "apply_source_changes", {
        changes: [{ path, before, after }],
      });
      if (!answer.ok || answer.problems.length) throw new Error(JSON.stringify(answer));
      const written = answer.result?.written;
      if (!Array.isArray(written) || written.length !== 1 || written[0] !== path)
        throw new Error("invalid source write acknowledgement; inspect source before retrying");
    },
  };
}
