// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkProject } from "@assemblejs/cli";

const project = (files: Record<string, string>): string => {
  const root = mkdtempSync(join(tmpdir(), "check-"));
  writeFileSync(join(root, "package.json"), "{}");
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), contents);
  }
  return root;
};

describe("checking a project", () => {
  it("finds nothing wrong with a project that is right", () => {
    const root = project({
      "src/assemblies/hello/hello.html": "<p>hi</p>",
      "src/pages/home/home.html": '<body><assembly name="hello"></assembly></body>',
    });
    expect(checkProject(root)).toEqual([]);
  });

  it("reports each finding with the file relative to the project, the rule and the fix", () => {
    const root = project({
      "src/assemblies/Cart/Cart.html": "",
      "src/assemblies/menu/menu.tsx": "",
      "src/assemblies/hello/hello.html": "",
      "src/pages/home/home.html": '<body><assembly name="nope"></assembly></body>',
      "src/pages/broken/broken.html": '<assembly nam="hello"></assembly>',
      "src/api/Bad.api.ts": "",
    });
    const findings = checkProject(root);
    const by = (rule: string) => findings.filter((finding) => finding.rule === rule);
    expect(by("directory-is-an-assembly")[0]).toMatchObject({
      path: "src/assemblies/Cart",
      fix: 'rename the directory to "cart"',
    });
    expect(by("the-file-name-says-the-framework")[0]?.path).toBe("src/assemblies/menu/menu.tsx");
    expect(
      by("a-placement-names-an-assembly")
        .map((finding) => finding.path)
        .sort(),
    ).toEqual(["src/pages/broken/broken.html", "src/pages/home/home.html"]);
    expect(
      by("a-placement-names-an-assembly").find((f) => f.path === "src/pages/home/home.html")?.fix,
    ).toBe("add it, or place one that exists: hello");
    expect(by("an-api-file-is-an-api")[0]?.path).toBe("src/api/Bad.api.ts");
  });
});
