// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { checkDistTags } from "./check-dist-tags.mjs";

for (const outcome of ["stable-valid", "stable-needs-repair", "unavailable", "denied-stable"]) {
  test(`repair recovery follows final observed state: ${outcome}`, () => {
    const next = "1.0.0-next.10";
    let metadata = { versions: ["1.0.0-next.2", next], tags: { latest: "1.0.0-next.2", next } };
    let wrote = false;
    let writes = 0;
    const run = (args) => {
      if (args[0] === "--version") return { status: 0, stdout: "11.21.0" };
      if (args[0] === "dist-tag") {
        wrote = true;
        writes++;
        metadata = {
          versions: [...metadata.versions, "1.0.0"],
          tags: { latest: outcome === "stable-needs-repair" ? next : "1.0.0", next },
        };
        return { status: outcome === "denied-stable" ? 1 : 0, stdout: "" };
      }
      if (wrote && outcome === "unavailable") return { status: 1, stdout: "PRIVATE ERROR" };
      return {
        status: 0,
        stdout: JSON.stringify(args[2] === "versions" ? metadata.versions : metadata.tags),
      };
    };
    assert.throws(
      () =>
        checkDistTags({
          packages: [{ name: "@x/core", version: next }],
          run,
          repair: true,
          say() {},
        }),
      (error) => {
        assert.ok(!error.message.includes(`npm dist-tag add @x/core@${next} latest`));
        assert.ok(!error.message.includes("PRIVATE ERROR"));
        if (outcome === "stable-needs-repair")
          assert.ok(error.message.includes("npm dist-tag add @x/core@1.0.0 latest"));
        else assert.ok(error.message.includes("npm view @x/core dist-tags"));
        return true;
      },
    );
    assert.equal(writes, 1);
  });
}

test("stable observed before writing requires current inspection, never stale prerelease advice", () => {
  const next = "1.0.0-next.10";
  let reads = 0;
  const run = (args) => {
    if (args[0] === "--version") return { status: 0, stdout: "11.21.0" };
    assert.equal(args[0], "view");
    reads++;
    const stable = reads > 2;
    const data = {
      versions: ["1.0.0-next.2", next, ...(stable ? ["1.0.0"] : [])],
      tags: { latest: stable ? "1.0.0" : "1.0.0-next.2", next },
    };
    return {
      status: 0,
      stdout: JSON.stringify(args[2] === "versions" ? data.versions : data.tags),
    };
  };
  assert.throws(
    () =>
      checkDistTags({
        packages: [{ name: "@x/core", version: next }],
        run,
        repair: true,
        say() {},
      }),
    (error) => {
      assert.ok(!error.message.includes(`npm dist-tag add @x/core@${next} latest`));
      assert.ok(error.message.includes("npm view @x/core dist-tags"));
      return true;
    },
  );
});
