// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkProject, declaredOrigins } from "@assemblejs/cli";

const config = (remotes: string): string =>
  `import { defineConfig } from "@assemblejs/core";\nconst producer = process.env.PRODUCER_ORIGIN ?? "";\nexport default defineConfig({ ${remotes} });`;

describe("the remotes a project's config declares", () => {
  it("are its literal origins, however quoted, and never one in a comment", () => {
    const source = `import { defineConfig } from "@assemblejs/cli";
      // { origin: "https://commented.example" }
      const elsewhere = { origin: "https://not-a-remote.example" };
      export default defineConfig({
        remotes: [{ origin: 'https://shop.example.com', forward: ["accept-language"] }, { origin: process.env.X }],
      });`;
    expect([...declaredOrigins(source).origins]).toEqual(["https://shop.example.com"]);
  });

  it("are all of them where each is written, and where the config declares none", () => {
    expect(declaredOrigins(config('remotes: [{ origin: "https://a.example" }]')).whole).toBe(true);
    expect(declaredOrigins(config("limits: { depth: 4 }"))).toEqual({
      origins: new Set(),
      whole: true,
    });
    expect(declaredOrigins("").whole).toBe(true);
  });

  // Where a server is, is known only where it runs, so an origin is read from the environment
  // as often as it is written. What cannot be read is not known to be absent.
  it("are not all of them where one is computed, or the list is, or the config is spread from another", () => {
    for (const remotes of [
      "remotes: [{ origin: producer }]",
      'remotes: [{ origin: "https://a.example" }, { origin: producer, trusted: true }]',
      "remotes: remotesOf(process.env)",
      "remotes: [...shared]",
      "...base",
    ]) {
      expect(declaredOrigins(config(remotes)).whole, remotes).toBe(false);
    }
  });

  it("through check: a placement from an origin the config computes is not refused as undeclared", async () => {
    const root = mkdtempSync(join(tmpdir(), "origins-"));
    const file = (path: string, contents: string): void => {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), contents);
    };
    file("package.json", "{}");
    file(
      "src/pages/home/home.html",
      '<html><body><assembly name="tally"></assembly></body></html>',
    );
    file(
      "src/pages/home/home.page.ts",
      'import { definePage } from "@assemblejs/core";\nexport default definePage({ place: { tally: { url: "https://shop.example.com/assembly/tally/" } } });',
    );
    const undeclared = async (remotes: string) => {
      file("assemblejs.config.ts", config(remotes));
      return (await checkProject(root))
        .map((problem) => problem.message)
        .filter((message) => message.includes("not a declared remote"));
    };
    expect(await undeclared("remotes: [{ origin: producer }]")).toEqual([]);
    // Where every origin is written, one that is not among them is still refused.
    expect(await undeclared('remotes: [{ origin: "https://other.example" }]')).toHaveLength(1);
    expect(await undeclared('remotes: [{ origin: "https://shop.example.com" }]')).toEqual([]);
  });
});
