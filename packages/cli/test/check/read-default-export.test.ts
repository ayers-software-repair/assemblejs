// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { UNWRITTEN, readDefaultExport } from "@assemblejs/cli";

describe("reading what a module default-exports without running it", () => {
  it("reads the argument of the call it is, literals kept and anything computed undefined", () => {
    // A number, a negated number, a boolean and null are literals too, kept as written.
    const source = `import { definePage } from "@assemblejs/core";
      const quote = /"/;
      const base: string = "https://a.example";
      export default definePage({
        place: {
          cart: { retry: { attempts: 2 }, url: 'https://shop.example.com/assembly/cart/' },
          search: { url: \`\${base}/assembly/search/\` },
          plain: { url: \`https://t.example/a/\`, tags: ["a", base], defer: true, deadline: -1, none: null },
          ...extra,
          [key]: { url: "x" },
        },
      });`;
    expect(readDefaultExport(source)).toEqual({
      place: {
        [UNWRITTEN]: true,
        cart: { retry: { attempts: 2 }, url: "https://shop.example.com/assembly/cart/" },
        search: { url: undefined },
        plain: {
          url: "https://t.example/a/",
          tags: ["a", undefined],
          defer: true,
          deadline: -1,
          none: null,
        },
      },
    });
  });

  it("follows the name a call is given to what it was declared as, one call deep", () => {
    const named =
      "const shared = { budgets: { document: 1 } };\nexport default defineConfig(shared);";
    expect(readDefaultExport(named)).toEqual({ budgets: { document: 1 } });
    expect(readDefaultExport("export default f(g({ a: 1 }));")).toBeUndefined();
  });

  it("reads a default export declared as a variable, and nothing that is not exported", () => {
    const source = `// { origin: "https://comment.example" }
      const unrelated = { remotes: [{ origin: "https://not-exported.example" }] };
      const config = { remotes: [{ origin: "https://real.example" }] };
      export default config;`;
    expect(readDefaultExport(source)).toEqual({ remotes: [{ origin: "https://real.example" }] });
    expect(readDefaultExport("export const a = 1;")).toBeUndefined();
  });

  it("throws for a module that cannot be compiled", () => {
    expect(() => readDefaultExport("export default {")).toThrow();
  });
});
