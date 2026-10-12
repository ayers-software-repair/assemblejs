// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { transformSync } from "esbuild";
import { describe, expect, it } from "vitest";
import { RULES, checkProject, unreadableSource } from "@assemblejs/cli";

const thrownBy = (source: string): unknown => {
  try {
    transformSync(source, { loader: "tsx" });
  } catch (error) {
    return error;
  }
  throw new Error("that compiled");
};

describe("the finding for a source file that does not compile", () => {
  it("names the file, the rule, and what the compiler said first, with its line", () => {
    const found = unreadableSource(
      "src/api/broken.api.ts",
      thrownBy('export default defineApi({ path: "/api/x",\n  handle: () => ({ }\n'),
    );
    expect(found).toEqual({
      path: "src/api/broken.api.ts",
      rule: "a-source-file-compiles",
      message: expect.stringMatching(/^broken\.api\.ts does not compile: .+ \(line \d+\)$/),
      fix: "correct it; until it compiles, nothing else about it can be checked",
    });
  });

  it("says what any other throw said, where it was not the compiler's", () => {
    expect(unreadableSource("src/api/x.api.ts", new Error("no default export")).message).toBe(
      "x.api.ts does not compile: no default export",
    );
  });

  it("is named by a rule that explain can answer", () => {
    expect(RULES.find((rule) => rule.id === "a-source-file-compiles")?.because).toMatch(
      /cannot see/,
    );
  });
});

// Each of these was passed over: check said no problems of a file the build then stopped on.
describe("through check: a file that does not compile", () => {
  const project = (files: Readonly<Record<string, string>>): string => {
    const root = mkdtempSync(join(tmpdir(), "unreadable-"));
    for (const [path, contents] of Object.entries({ "package.json": "{}", ...files })) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), contents);
    }
    return root;
  };
  const found = async (files: Readonly<Record<string, string>>) =>
    (await checkProject(project(files)))
      .filter((problem) => problem.rule === "a-source-file-compiles")
      .map((problem) => [problem.path, problem.message.split(":")[0]]);

  it("is a finding where it is an api", async () => {
    expect(
      await found({
        "src/api/broken.api.ts": 'export default defineApi({ path: "/api/x", handle: (',
      }),
    ).toEqual([["src/api/broken.api.ts", "broken.api.ts does not compile"]]);
  });

  it("is a finding where it is a view written as a module, or a component of one", async () => {
    expect(
      await found({
        "src/assemblies/photo/photo.react.tsx":
          'export default function Photo() {\n  return <figure><img alt="x" /></figcaption>;\n}\n',
        "src/assemblies/cart/cart.preact.tsx":
          'import { Row } from "./row.js";\nexport default () => <ul><Row /></ul>;\n',
        "src/assemblies/cart/row.tsx": "export const Row = () => <li>;\n",
      }),
    ).toEqual([
      ["src/assemblies/cart/row.tsx", "row.tsx does not compile"],
      ["src/assemblies/photo/photo.react.tsx", "photo.react.tsx does not compile"],
    ]);
  });

  it("is none where every file compiles", async () => {
    expect(
      await found({
        "src/api/time.api.ts": 'export default { path: "/api/time", handle: () => ({}) };',
        "src/assemblies/photo/photo.react.tsx": "export default () => <p>photo</p>;",
      }),
    ).toEqual([]);
  });
});
