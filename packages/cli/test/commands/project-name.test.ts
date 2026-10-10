// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { PROJECT_NAME } from "@assemblejs/cli";

describe("what a new project may be called", () => {
  it("is lower case, a letter first, then letters, digits and hyphens", () => {
    for (const name of ["shop", "my-app", "shop2", "a"]) {
      expect(PROJECT_NAME.test(name), name).toBe(true);
    }
  });

  // Each of these would be a directory, and a package, that something later refuses.
  it("is nothing a directory or a package could not be named", () => {
    for (const name of [
      "My App",
      "my_app",
      "2shop",
      "-shop",
      "@scope/shop",
      "../shop",
      "shop/",
      "",
    ]) {
      expect(PROJECT_NAME.test(name), name).toBe(false);
    }
  });
});
