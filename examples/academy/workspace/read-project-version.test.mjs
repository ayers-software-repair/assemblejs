// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { calculatorFixture } from "./calculator-fixture.mjs";
import { readProjectVersion } from "./read-project-version.js";

test("source identity reuses the real tool acknowledgement", async () => {
  const f = calculatorFixture();
  assert.match(await readProjectVersion(f.client), /^[a-f0-9]{12}$/);
  assert.deepEqual(
    f.calls.map((call) => call.name),
    ["read_source_version"],
  );
});
test("malformed or failed source identity is never coerced into success", async () => {
  const f = calculatorFixture();
  for (const value of [null, 123456789012, "", "ABCDEF123456", "short"])
    await assert.rejects(
      readProjectVersion({ callTool: async () => f.answer({ version: value }) }),
      /unavailable/,
    );
  await assert.rejects(
    readProjectVersion({
      callTool: async () => f.answer({ version: "abcdef123456" }, false, ["failed"]),
    }),
    /unavailable/,
  );
});
