// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { discoverApis } from "@asmjs/build";

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

  // A file that is nearly an api, and a directory that is nearly the one read, were left out of
  // the build with nothing saying so.
  it("names a file that is nearly an api, and a directory that is nearly the one it reads", () => {
    const root = mkdtempSync(join(tmpdir(), "api-"));
    mkdirSync(join(root, "src", "api"), { recursive: true });
    mkdirSync(join(root, "src", "apis"), { recursive: true });
    for (const file of ["api/orders.apis.ts", "api/api.ts", "api/db.ts", "apis/time.api.ts"]) {
      writeFileSync(join(root, "src", file), "");
    }
    const { apis, problems } = discoverApis(root);
    expect(apis).toEqual([]);
    expect(problems.map((problem) => [problem.rule, problem.message, problem.fix])).toEqual([
      [
        "an-api-file-is-an-api",
        '"api.ts" is not read: an api file is named "<name>.api.ts"',
        "rename it for the api it declares, or remove it",
      ],
      [
        "an-api-file-is-an-api",
        '"orders.apis.ts" is not read: an api file is named "<name>.api.ts"',
        'rename it to "orders.api.ts", or remove it',
      ],
      [
        "an-api-file-is-an-api",
        '"src/apis" is not read: api files are in "src/api"',
        "move its files into src/api, or remove it",
      ],
    ]);
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
