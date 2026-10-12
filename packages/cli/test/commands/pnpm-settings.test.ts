// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { PNPM_SETTINGS, projectFiles } from "@assemblejs/cli";

// Found 2026-10-11, with pnpm 11.4.0: a fresh project's first `pnpm install` ended in
// ERR_PNPM_IGNORED_BUILDS for esbuild and exit 1, and every `pnpm exec` after it refused to run.
describe("the pnpm settings a project made by pnpm starts with", () => {
  it("rule on the one install script among its dependencies, and rule it out", () => {
    expect(PNPM_SETTINGS).toMatch(/^allowBuilds:\n {2}esbuild: false$/m);
    expect(
      PNPM_SETTINGS.split("\n").filter((line) => !line.startsWith("#") && line !== ""),
    ).toEqual(["allowBuilds:", "  esbuild: false"]);
  });

  it("are written for a project pnpm made, and for no other", () => {
    expect(projectFiles("shop", "pnpm")["pnpm-workspace.yaml"]).toBe(PNPM_SETTINGS);
    for (const manager of ["npm", "yarn", "bun"]) {
      expect(Object.keys(projectFiles("shop", manager))).not.toContain("pnpm-workspace.yaml");
    }
    expect(Object.keys(projectFiles("shop"))).not.toContain("pnpm-workspace.yaml");
  });
});
