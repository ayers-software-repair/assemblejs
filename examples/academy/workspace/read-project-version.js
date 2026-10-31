// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { callProjectTool } from "./call-project-tool.js";

/** Read the actual saved-source fingerprint without coercing a malformed acknowledgement. */
export async function readProjectVersion(client) {
  const answer = await callProjectTool(client, "read_source_version");
  if (
    !answer.ok ||
    answer.problems.length ||
    typeof answer.result?.version !== "string" ||
    !/^[a-f0-9]{12}$/.test(answer.result.version)
  )
    throw new Error(`Project source version unavailable: ${JSON.stringify(answer)}`);
  return answer.result.version;
}
