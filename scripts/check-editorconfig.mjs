#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// The root .editorconfig is a byte-copy of the house file, platform/codestyle/.editorconfig,
// because EditorConfig has no include and Prettier reads only the project's own copy. A copy
// drifts by a hand edit here or by a change to the canonical there, and neither is visible from
// inside this repository, so this gate holds the copy to the canonical's hash at a named tag.
// Re-syncing is one step: copy the canonical, then record its hash and tag below.
//
// The tag is the product's one platform pin, and the gate refuses a recorded tag that is not it.
// The repository is public and its CI checks nothing out with a credential, which is why a hash
// stands here where the private repositories cmp the checkout.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { offThePin } from "./platform-pin.mjs";

export const CANONICAL = {
  tag: "v0.67.0",
  changed: "v0.21.0",
  sha256: "d0bf9fa73b59194d7c67bb90b0ab3e2c33563e1e9f9f67e836f5640af3f133d9",
};

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Every way the copy is wrong, one line each: its bytes, or a second copy layered over it. */
export function drift(bytes, tracked) {
  const problems = [];
  const sha = digest(bytes);
  if (sha !== CANONICAL.sha256) {
    problems.push(
      `.editorconfig is not the house file at platform/codestyle ${CANONICAL.tag} (sha256 ${sha.slice(0, 12)}, expected ${CANONICAL.sha256.slice(0, 12)}): copy it again, or record the new hash and tag with the reason`,
    );
  }
  const nested = tracked.filter(
    (path) => path.endsWith(".editorconfig") && path !== ".editorconfig",
  );
  if (nested.length > 0) {
    problems.push(
      `a nested .editorconfig layers an unpinned style over the root: ${nested.join(", ")}`,
    );
  }
  return problems;
}

const isEntryPoint = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isEntryPoint) {
  if (process.argv[2] === "--self-test") {
    const good = readFileSync(".editorconfig");
    const edited = Buffer.concat([good, Buffer.from("indent_size = 4\n")]);
    const red = drift(edited, ["packages/cli/.editorconfig"]);
    const moved = offThePin("the root .editorconfig", CANONICAL.tag, "v0.0.0");
    const held = offThePin("the root .editorconfig", CANONICAL.tag, CANONICAL.tag);
    if (
      red.length !== 2 ||
      !red[0].includes("not the house file") ||
      !red[1].includes("nested") ||
      moved.length !== 1 ||
      !moved[0].includes("pinned to v0.0.0") ||
      held.length !== 0
    ) {
      console.error(`editorconfig gate self-test FAILED: ${JSON.stringify([...red, ...moved])}`);
      process.exit(1);
    }
    console.log(
      "editorconfig gate self-test: red on an edited copy, a nested file and a tag that is not the pin, as required",
    );
    process.exit(0);
  }
  const tracked = execFileSync("git", ["ls-files", "-z", "--", "*.editorconfig"], {
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean);
  const problems = [
    ...drift(readFileSync(".editorconfig"), tracked),
    ...offThePin("the root .editorconfig", CANONICAL.tag),
  ];
  for (const problem of problems) console.error(`editorconfig gate: ${problem}`);
  if (problems.length > 0) process.exit(1);
  console.log(
    `editorconfig gate: clean (the house file at platform/codestyle ${CANONICAL.tag}, the pin)`,
  );
}
