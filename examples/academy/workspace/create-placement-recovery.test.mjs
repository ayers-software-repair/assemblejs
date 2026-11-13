// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { Window } from "happy-dom";
import { createPlacementRecovery } from "./create-placement-recovery.js";

test("placement recovery requires an actual named finding and a clean changed revision", async () => {
  const finding = {
    path: "src/pages/product/product.html",
    rule: "a-placement-names-an-assembly",
    message: 'product places "buy-box-missing", and there is no such assembly',
    fix: "Use an existing assembly",
  };
  let version = "123456789abc";
  let findings = [];
  let changeDuringCheck = false;
  const window = new Window();
  let commented = false;
  const check = createPlacementRecovery(window.document, {
    async callTool({ name, arguments: args }) {
      const answer =
        name === "read_source_version"
          ? { ok: true, result: { version }, problems: [] }
          : name === "read_source"
            ? {
                ok: true,
                result: {
                  path: args.path,
                  contents: findings.length
                    ? '<assembly name="buy-box-missing"></assembly>'
                    : commented
                      ? '<!-- <assembly name="buy-box"></assembly> -->'
                      : '<assembly name="buy-box"></assembly>',
                },
                problems: [],
              }
            : { ok: findings.length === 0, result: { findings }, problems: findings };
      if (name === "check" && changeDuringCheck) version = "987654321abc";
      return { content: [{ type: "text", text: JSON.stringify(answer) }] };
    },
  });
  const signal = new AbortController().signal;
  assert.equal((await check(signal)).kind, "no-observed-failure");
  findings = [finding];
  changeDuringCheck = true;
  await assert.rejects(check(signal), /changed during checking/);
  changeDuringCheck = false;
  assert.equal((await check(signal)).kind, "finding");
  findings = [];
  assert.equal((await check(signal)).kind, "no-observed-failure");
  version = "abcdef123456";
  commented = true;
  assert.equal((await check(signal)).kind, "no-observed-failure");
  commented = false;
  assert.deepEqual(await check(signal), {
    kind: "recovered",
    lesson: "fix-placement",
    revision: 1,
    version,
    failedVersion: "987654321abc",
  });
  window.close();
});
