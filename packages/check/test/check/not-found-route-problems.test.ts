// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkProject, notFoundRouteProblems } from "@asmjs/check";

const project = (files: Record<string, string>): string => {
  const root = mkdtempSync(join(tmpdir(), "check-"));
  writeFileSync(join(root, "package.json"), "{}");
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), contents);
  }
  return root;
};

describe("checking a project with a not-found page", () => {
  it("names the route it declares, and holds no route of its to the other pages", async () => {
    const at = (declaration: string) =>
      project({
        "src/server.ts": "",
        "src/assemblies/hello/hello.html": "<p>hi</p>",
        "src/pages/home/home.html": '<body><assembly name="hello"></assembly></body>',
        "src/pages/not-found/not-found.html": '<body><assembly name="hello"></assembly></body>',
        "src/pages/not-found/not-found.page.ts": declaration,
        // At the route the directory would imply, which the not-found page does not take.
        "src/pages/gone/gone.html": '<body><assembly name="hello"></assembly></body>',
        "src/pages/gone/gone.page.ts": 'export default { route: "/not-found" };',
      });
    expect(await checkProject(at('export default { route: "/missing" };'))).toEqual([
      expect.objectContaining({
        path: "src/pages/not-found/not-found.page.ts",
        rule: "the-not-found-page-has-no-route",
      }),
    ]);
    expect(await checkProject(at("export default {};"))).toEqual([]);
  });
});

const page = (name: string, declaration?: string) => {
  const root = mkdtempSync(join(tmpdir(), "not-found-"));
  mkdirSync(join(root, "src", "pages", name), { recursive: true });
  const file = join(root, "src", "pages", name, `${name}.page.ts`);
  if (declaration !== undefined) writeFileSync(file, declaration);
  return {
    root,
    page: {
      name,
      route: `/${name}`,
      template: join(root, "src", "pages", name, `${name}.html`),
      declaration: declaration === undefined ? undefined : file,
    },
  };
};

describe("a route the not-found page declares", () => {
  it("is a problem, where the declaration is", async () => {
    const { root, page: found } = page("not-found", 'export default { route: "/oops" };');
    expect(await notFoundRouteProblems(root, found)).toEqual([
      expect.objectContaining({ path: found.declaration, rule: "the-not-found-page-has-no-route" }),
    ]);
  });

  it("is none where it declares no route, has no declaration, or is another page", async () => {
    const placed = page("not-found", "export default { place: { hello: { deadline: 50 } } };");
    expect(await notFoundRouteProblems(placed.root, placed.page)).toEqual([]);
    const bare = page("not-found");
    expect(await notFoundRouteProblems(bare.root, bare.page)).toEqual([]);
    const other = page("about", 'export default { route: "/us" };');
    expect(await notFoundRouteProblems(other.root, other.page)).toEqual([]);
  });
});
