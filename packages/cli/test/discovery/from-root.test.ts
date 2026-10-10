// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { fromRoot } from "@assemblejs/cli";

describe("a path as a finding or a shape shows it", () => {
  it("is from the project's root, with forward slashes whatever wrote it", () => {
    const root = join("/work", "shop");
    expect(fromRoot(root, join(root, "src", "pages", "home", "home.html"))).toBe(
      "src/pages/home/home.html",
    );
    expect(fromRoot(root, `${root}/src\\api\\prices.api.ts`)).toBe("src/api/prices.api.ts");
  });

  it("is a dot for the root itself, never an empty string", () => {
    expect(fromRoot(join("/work", "shop"), join("/work", "shop"))).toBe(".");
  });
});
