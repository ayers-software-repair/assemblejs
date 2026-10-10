// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { discoverApis } from "@assemblejs/cli";

describe("discovering apis", () => {
  it("finds every api file in name order, and reports one that is misnamed", () => {
    const root = mkdtempSync(join(tmpdir(), "api-"));
    mkdirSync(join(root, "src", "api"), { recursive: true });
    for (const file of ["time.api.ts", "cart-items.api.ts", "Bad.api.ts", "helper.ts"]) {
      writeFileSync(join(root, "src", "api", file), "");
    }
    const { apis, problems } = discoverApis(root);
    expect(apis.map((file) => file.slice(file.lastIndexOf("/") + 1))).toEqual([
      "cart-items.api.ts",
      "time.api.ts",
    ]);
    expect(problems[0]).toMatchObject({
      rule: "an-api-file-is-an-api",
      message: expect.stringMatching(/"Bad\.api\.ts" is not a usable api file name/),
      fix: 'rename it to "bad.api.ts"',
    });
  });

  it("is empty for a project with no api directory", () => {
    expect(discoverApis(join(tmpdir(), "no-such-project"))).toEqual({ apis: [], problems: [] });
  });

  // Nothing outside the project is looked at.
  it("keeps an api file that leads out by its name, and reports it", () => {
    const outside = mkdtempSync(join(tmpdir(), "api-outside-"));
    writeFileSync(join(outside, "secret.api.ts"), "");
    const root = mkdtempSync(join(tmpdir(), "api-"));
    mkdirSync(join(root, "src", "api"), { recursive: true });
    writeFileSync(join(root, "src", "api", "time.api.ts"), "");
    symlinkSync(join(outside, "secret.api.ts"), join(root, "src", "api", "prices.api.ts"));
    const { apis, problems } = discoverApis(root);
    expect(apis).toEqual([`${root}/src/api/prices.api.ts`, `${root}/src/api/time.api.ts`]);
    expect(problems.map((problem) => [problem.path, problem.rule])).toEqual([
      [`${root}/src/api/prices.api.ts`, "a-project-stays-inside-its-root"],
    ]);
  });

  it("lists nothing, and says why, where the api directory itself leads out", () => {
    const outside = mkdtempSync(join(tmpdir(), "api-outside-"));
    writeFileSync(join(outside, "secret.api.ts"), "");
    const root = mkdtempSync(join(tmpdir(), "api-"));
    mkdirSync(join(root, "src"));
    symlinkSync(outside, join(root, "src", "api"));
    expect(discoverApis(root)).toMatchObject({
      apis: [],
      problems: [{ path: `${root}/src/api`, rule: "a-project-stays-inside-its-root" }],
    });
  });
});
