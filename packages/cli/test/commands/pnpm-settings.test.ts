// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Io } from "@asmjs/build";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PNPM_SETTINGS, projectFiles, run } from "@asmjs/cli";

// With pnpm 11.4.0, a fresh project's first `pnpm install` without them ends in
// ERR_PNPM_IGNORED_BUILDS for esbuild and exit 1, and every `pnpm exec` after it refuses to run.
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

// Who made the project is whoever ran the command, which the environment says and nothing else.
describe("new, run by a package manager", () => {
  afterEach(() => void vi.unstubAllEnvs());
  const made = (agent: string) => {
    vi.stubEnv("npm_config_user_agent", agent);
    const written: string[] = [];
    const logs: string[] = [];
    const io: Io = {
      write: (path) => void written.push(path.replaceAll("\\", "/")),
      exists: () => false,
      remove: () => undefined,
      log: (line) => logs.push(line),
      error: () => undefined,
    };
    expect(run(["new", "shop"], io)).toBe(0);
    return { written, said: logs.join("\n") };
  };

  it("writes pnpm its settings and names pnpm for the install", () => {
    const { written, said } = made("pnpm/11.4.0 npm/? node/v24.0.0 linux x64");
    expect(written).toContain("shop/pnpm-workspace.yaml");
    expect(said).toContain("pnpm install");
  });

  it("writes npm no file of pnpm's and names npm for the install", () => {
    const { written, said } = made("npm/11.0.0 node/v24.0.0 linux x64");
    expect(written).not.toContain("shop/pnpm-workspace.yaml");
    expect(said).toContain("npm install");
    expect(said).not.toContain("pnpm");
  });
});
