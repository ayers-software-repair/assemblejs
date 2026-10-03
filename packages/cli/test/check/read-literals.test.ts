// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { readLiterals } from "@assemblejs/cli";

describe("reading the object literals of a module without running it", () => {
  it("keeps literal values at any depth, and marks computed ones null", () => {
    const source = `import { definePage } from "@assemblejs/core";
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
    expect(readLiterals(source)).toEqual([
      {
        place: {
          cart: { retry: { attempts: null }, url: "https://shop.example.com/assembly/cart/" },
          search: { url: null },
          plain: { url: "https://t.example/a/", tags: ["a", null] },
        },
      },
    ]);
  });

  it("does not read a comment, a type, or a block as an object", () => {
    const source = `// remotes: [{ origin: "https://comment.example" }]
      /* { origin: "https://block-comment.example" } */
      type Shape = { origin: "https://type.example" };
      function f() { return 1; }
      export default { remotes: [{ origin: "https://real.example" }] };`;
    expect(readLiterals(source)).toEqual([{ remotes: [{ origin: "https://real.example" }] }]);
  });
});
