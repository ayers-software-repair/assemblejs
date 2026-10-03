// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { readDefaultExport } from "@assemblejs/cli";

describe("reading what a module default-exports without running it", () => {
  it("reads the argument of the call it is, literals kept and anything computed null", () => {
    const source = `import { definePage } from "@assemblejs/core";
      const quote = /"/;
      const base: string = "https://a.example";
      export default definePage({
        place: {
          cart: { retry: { attempts: 2 }, url: 'https://shop.example.com/assembly/cart/' },
          search: { url: \`\${base}/assembly/search/\` },
          plain: { url: \`https://t.example/a/\`, tags: ["a", base] },
          ...extra,
          [key]: { url: "x" },
        },
      });`;
    expect(readDefaultExport(source)).toEqual({
      place: {
        cart: { retry: { attempts: null }, url: "https://shop.example.com/assembly/cart/" },
        search: { url: null },
        plain: { url: "https://t.example/a/", tags: ["a", null] },
      },
    });
  });

  it("reads a default export declared as a variable, and nothing that is not exported", () => {
    const source = `// { origin: "https://comment.example" }
      const unrelated = { remotes: [{ origin: "https://not-exported.example" }] };
      const config = { remotes: [{ origin: "https://real.example" }] };
      export default config;`;
    expect(readDefaultExport(source)).toEqual({ remotes: [{ origin: "https://real.example" }] });
    expect(readDefaultExport("export const a = 1;")).toBeNull();
  });

  it("throws for a module that cannot be compiled", () => {
    expect(() => readDefaultExport("export default {")).toThrow();
  });
});
