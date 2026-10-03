// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { declaredOrigins } from "@assemblejs/cli";

describe("the remotes a project's config declares", () => {
  it("are its literal origins, however quoted, and never one in a comment", () => {
    const source = `import { defineConfig } from "@assemblejs/cli";
      // { origin: "https://commented.example" }
      export default defineConfig({
        remotes: [{ origin: 'https://shop.example.com', forward: ["accept-language"] }, { origin: process.env.X }],
      });`;
    expect([...declaredOrigins(source)]).toEqual(["https://shop.example.com"]);
  });
});
