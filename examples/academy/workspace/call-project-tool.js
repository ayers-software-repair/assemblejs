// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** The existing MCP surface returns one JSON text block; malformed replies fail closed. */
export async function callProjectTool(client, name, args = {}) {
  const reply = await client.callTool({ name, arguments: args });
  const blocks = reply?.content;
  if (
    !Array.isArray(blocks) ||
    blocks.length !== 1 ||
    blocks[0]?.type !== "text" ||
    typeof blocks[0].text !== "string" ||
    blocks[0].text.length > 1000000
  )
    throw new Error("invalid project tool response");
  if (reply.isError) throw new Error(blocks[0].text);
  const answer = JSON.parse(blocks[0].text);
  if (typeof answer?.ok !== "boolean" || !Array.isArray(answer.problems))
    throw new Error("invalid project tool result");
  return answer;
}
