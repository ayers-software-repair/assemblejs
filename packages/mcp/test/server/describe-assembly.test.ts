// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { describeAssembly, describeProject, resolveRoot } from "@asmjs/mcp";
import type { ProjectRoot } from "@asmjs/mcp";

let root: ProjectRoot;
let dir = "";

const file = (path: string, contents = ""): void => {
  mkdirSync(join(dir, path, ".."), { recursive: true });
  writeFileSync(join(dir, path), contents);
};

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "assemblejs-mcp-assembly-"));
  root = resolveRoot(dir);
  file("src/assemblies/cart/cart.html", "<p>cart</p>");
  file("src/assemblies/cart/cart.service.ts", "export default { load: () => ({}) };");
  file("src/assemblies/shell/shell.html", '<header><assembly name="cart"></assembly></header>');
  file(
    "src/pages/home/home.html",
    '<main><assembly name="shell"></assembly><assembly name="cart"></assembly><assembly name="cart" view="compact"></assembly></main>',
  );
  file("src/pages/home/home.page.ts", "export default { place: { cart: { defer: true } } };");
  file("src/pages/about/about.html", '<main><assembly name="cart"></assembly></main>');
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("one assembly of the project", () => {
  it("is its files, its renderer and what its view places", async () => {
    expect(await describeAssembly(root, "shell")).toMatchObject({
      name: "shell",
      directory: "src/assemblies/shell",
      view: "src/assemblies/shell/shell.html",
      renderer: "html",
      places: [{ name: "cart", view: "default" }],
    });
    expect((await describeAssembly(root, "cart"))?.service).toBe(
      "src/assemblies/cart/cart.service.ts",
    );
  });

  it("is every placement of it on a page, with the route and the page's policy for it", async () => {
    expect((await describeAssembly(root, "cart"))?.placedOn).toEqual([
      { page: "about", route: "/about", view: "default", policy: {} },
      { page: "home", route: "/", view: "default", policy: { defer: true } },
      { page: "home", route: "/", view: "compact", policy: { defer: true } },
    ]);
    expect((await describeAssembly(root, "shell"))?.placedOn).toEqual([
      { page: "home", route: "/", view: "default", policy: {} },
    ]);
  });

  it("is every placement of it in another assembly's view", async () => {
    expect((await describeAssembly(root, "cart"))?.placedIn).toEqual([
      { assembly: "shell", view: "default" },
    ]);
    expect((await describeAssembly(root, "shell"))?.placedIn).toEqual([]);
  });

  it("says of each placement what its page's policy could not be read as", async () => {
    file("src/pages/home/home.page.ts", "export default { place: ");
    expect((await describeAssembly(root, "cart"))?.placedOn.map((placed) => placed.policy)).toEqual(
      [{}, "(unread)", "(unread)"],
    );
    file("src/pages/home/home.page.ts", "export default { place: policyFor(process.env) };");
    expect((await describeAssembly(root, "shell"))?.placedOn[0]?.policy).toBe("(computed)");
  });

  it("is the same assembly the whole project names, so the two cannot disagree", async () => {
    const whole = (await describeProject(root)).assemblies.find(
      (assembly) => assembly.name === "cart",
    );
    const one = await describeAssembly(root, "cart");
    expect(one).toMatchObject({
      ...whole,
      placedOn: expect.anything(),
      placedIn: expect.anything(),
    });
    expect([...new Set(one?.placedOn.map((placed) => placed.page))]).toEqual(whole?.placedOn);
    expect(one?.placedIn.map((placed) => placed.assembly)).toEqual(whole?.placedIn);
  });

  it("is nothing for a name the project has no assembly by", async () => {
    expect(await describeAssembly(root, "missing")).toBeUndefined();
    expect(await describeAssembly(root, "home")).toBeUndefined();
    expect(await describeAssembly(root, "../cart")).toBeUndefined();
    expect(await describeAssembly(root, "car")).toBeUndefined();
  });
});
