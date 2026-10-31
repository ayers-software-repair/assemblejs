// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { callProjectTool } from "./call-project-tool.js";

test("only the existing structured MCP result is accepted", async () => {
  for (const reply of [
    null,
    {},
    { content: [] },
    { content: [{ type: "image", text: "x" }] },
    { content: [{ type: "text", text: "broken" }] },
    { content: [{ type: "text", text: '{"ok":"yes","problems":[]}' }] },
    { content: [{ type: "text", text: "x".repeat(1000001) }] },
  ])
    await assert.rejects(callProjectTool({ callTool: async () => reply }, "check"));
  const answer = { ok: false, result: null, problems: ["actual refusal"] };
  assert.deepEqual(
    await callProjectTool(
      {
        callTool: async (request) => {
          assert.deepEqual(request, { name: "check", arguments: {} });
          return { content: [{ type: "text", text: JSON.stringify(answer) }] };
        },
      },
      "check",
    ),
    answer,
  );
});

test("a protocol error preserves its diagnostic rather than becoming a normal result", async () => {
  await assert.rejects(
    callProjectTool(
      {
        callTool: async () => ({
          isError: true,
          content: [{ type: "text", text: "server unavailable" }],
        }),
      },
      "check",
    ),
    /server unavailable/,
  );
});
