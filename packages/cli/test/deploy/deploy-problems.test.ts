// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { deployProblems } from "@assemblejs/cli";

describe("what would make a deploy fail where it is installed", () => {
  it("passes imports the project lists in its dependencies", () => {
    expect(deployProblems(["a"], { dependencies: { a: "^1.0.0" } })).toEqual([]);
  });

  it("names an import listed only in devDependencies, one not listed, and a workspace specifier", () => {
    expect(
      deployProblems(["dev-only", "missing"], {
        dependencies: { linked: "workspace:*" },
        devDependencies: { "dev-only": "^1.0.0" },
      }),
    ).toEqual([
      "the server imports dev-only, which package.json lists only in devDependencies: move it to dependencies",
      "the server imports missing, which package.json does not list: add it to dependencies",
      'linked is "workspace:*", which only its workspace can install: give it a version',
    ]);
  });
});
