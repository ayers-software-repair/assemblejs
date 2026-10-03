// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { discoverApis } from "@assemblejs/cli";

describe("discovering apis", () => {
  it("finds every api file in name order, and reports one that is misnamed", () => {
    const root = mkdtempSync(join(tmpdir(), "api-"));
    for (const file of ["time.api.ts", "cart-items.api.ts", "Bad.api.ts", "helper.ts"]) {
      writeFileSync(join(root, file), "");
    }
    const { apis, problems } = discoverApis(root);
    expect(apis.map((file) => file.slice(file.lastIndexOf("/") + 1))).toEqual([
      "cart-items.api.ts",
      "time.api.ts",
    ]);
    expect(problems.join()).toMatch(/"Bad\.api\.ts" is not a usable api file name/);
  });

  it("is empty for a project with no api directory", () => {
    expect(discoverApis(join(tmpdir(), "no-such-api-dir"))).toEqual({ apis: [], problems: [] });
  });
});
