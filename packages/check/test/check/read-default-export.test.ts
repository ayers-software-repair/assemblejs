// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type * as Esbuild from "esbuild";
import { describe, expect, it, vi } from "vitest";
import { UNWRITTEN, readDefaultExport } from "@asmjs/check";

vi.mock("esbuild", async (original) => ({
  ...(await original<typeof Esbuild>()),
  transformSync: () => {
    throw new Error("synchronous compiler workers are unavailable");
  },
}));

describe("reading what a module default-exports without running it", () => {
  it("reads the argument of the call it is, literals kept and anything computed undefined", async () => {
    // A number, a negated number, a boolean and null are literals too, kept as written.
    const source = `import { definePage } from "@asmjs/core";
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
    expect(await readDefaultExport(source)).toEqual({
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

  it("follows the name a call is given to what it was declared as, one call deep", async () => {
    const named =
      "const shared = { budgets: { document: 1 } };\nexport default defineConfig(shared);";
    expect(await readDefaultExport(named)).toEqual({ budgets: { document: 1 } });
    expect(await readDefaultExport("export default f(g({ a: 1 }));")).toBeUndefined();
  });

  it("reads a default export declared as a variable, and nothing that is not exported", async () => {
    const source = `// { origin: "https://comment.example" }
      const unrelated = { remotes: [{ origin: "https://not-exported.example" }] };
      const config = { remotes: [{ origin: "https://real.example" }] };
      export default config;`;
    expect(await readDefaultExport(source)).toEqual({
      remotes: [{ origin: "https://real.example" }],
    });
    expect(await readDefaultExport("export const a = 1;")).toBeUndefined();
  });

  it("returns a Promise and preserves type exports without synchronous compiler workers", async () => {
    const reading = readDefaultExport(
      "interface Config { port: number }; export { Config }; export default { port: 3210 };",
    );
    expect(reading).toBeInstanceOf(Promise);
    await expect(reading).resolves.toEqual({ port: 3210 });
  });

  it("retains type-alias exports and rejects duplicate value exports without running source", async () => {
    await expect(
      readDefaultExport(
        'type Mount = "idle"; export { Mount }; throw new Error("never execute"); export default { port: 3210 };',
      ),
    ).resolves.toEqual({ port: 3210 });
    await expect(readDefaultExport("export const x = 1; export { x };")).rejects.toThrow();
  });

  it("throws for a module that cannot be compiled", async () => {
    await expect(readDefaultExport("export default {")).rejects.toThrow();
  });
});
