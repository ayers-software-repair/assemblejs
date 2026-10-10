// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { COMPUTED, UNREAD, readShape, realIo } from "@assemblejs/cli";
import { linkedProject } from "../fixtures/linked-project.js";

const REACT = 'import { Slot } from "@assemblejs/renderer-react/client";\n';

const project = (files: Record<string, string>): string => {
  const root = mkdtempSync(join(tmpdir(), "shape-"));
  for (const [path, contents] of Object.entries(files)) realIo.write(join(root, path), contents);
  return root;
};

const SHOP = {
  "src/pages/home/home.html":
    '<main><assembly name="shell"></assembly><assembly name="cart" view="compact"></assembly></main>',
  "src/pages/home/home.page.ts": "export default { place: { cart: { defer: true } } };",
  "src/pages/about/about.html": '<main><assembly name="shell"></assembly></main>',
  "src/assemblies/shell/shell.html": '<header><assembly name="cart"></assembly></header>',
  "src/assemblies/cart/cart.react.tsx": `${REACT}export default () => <Slot name="price" view="compact" />;`,
  "src/assemblies/cart/cart.service.ts": "export default { load: () => ({ items: 2 }) };",
  "src/assemblies/cart/cart.css": "p { margin: 0; }",
  "src/assemblies/price/price.html": "<p>price</p>",
  "src/assemblies/price/price.client.ts": "export default () => undefined;",
  "src/api/prices.api.ts": 'export default { path: "/api/prices", stream: () => undefined };',
  "assemblejs.config.ts": 'export default { remotes: [{ origin: "https://shop.example" }] };',
};

describe("a project's whole shape, read from its sources", () => {
  it("is every page, assembly and api, and what the config declares, in one read", () => {
    const shape = readShape(project(SHOP));
    expect(shape.pages.map((page) => [page.name, page.route])).toEqual([
      ["about", "/about"],
      ["home", "/"],
    ]);
    expect(shape.assemblies.map((assembly) => assembly.name)).toEqual(["cart", "price", "shell"]);
    expect(shape.apis).toEqual([
      { file: "src/api/prices.api.ts", path: "/api/prices", method: "GET", streams: true },
    ]);
    expect(shape.settings.remotes).toEqual([{ origin: "https://shop.example" }]);
    expect(shape.renderers).toEqual(["html", "react"]);
    expect(shape.problems).toEqual([]);
  });

  it("is each assembly's files from the root, and whether it has a browser half", () => {
    const [cart, price, shell] = readShape(project(SHOP)).assemblies;
    expect(cart).toMatchObject({
      directory: "src/assemblies/cart",
      view: "src/assemblies/cart/cart.react.tsx",
      renderer: "react",
      service: "src/assemblies/cart/cart.service.ts",
      styles: ["src/assemblies/cart/cart.css"],
      browserHalf: true,
    });
    expect(cart?.client).toBeUndefined();
    expect(price).toMatchObject({
      client: "src/assemblies/price/price.client.ts",
      browserHalf: true,
    });
    expect(shell).toMatchObject({ browserHalf: false, styles: [] });
    expect(shell?.service).toBeUndefined();
  });

  it("is how they are wired: what each view places, and where each assembly is placed", () => {
    const [cart, price, shell] = readShape(project(SHOP)).assemblies;
    expect(shell).toMatchObject({
      places: [{ name: "cart", view: "default" }],
      placedOn: ["about", "home"],
      placedIn: [],
    });
    expect(cart).toMatchObject({
      places: [{ name: "price", view: "compact" }],
      placedOn: ["home"],
      placedIn: ["shell"],
    });
    expect(price).toMatchObject({ places: [], placedOn: [], placedIn: ["cart"] });
  });

  it("marks a view only its render can tell of, and one that cannot be read, differently", () => {
    // This project has no templates renderer installed, so nothing here can read its Pug view.
    const shape = readShape(
      project({
        "src/assemblies/card/card.pug": 'assembly(name="cart")',
        "src/assemblies/torn/torn.html": '<assembly name="cart" timeout="5"></assembly>',
        "src/assemblies/cart/cart.html": "<p>cart</p>",
        "src/assemblies/row/row.react.tsx": `${REACT}export default ({ data }) => <Slot name="cart" view={data.view} />;`,
      }),
    );
    const places = Object.fromEntries(shape.assemblies.map((one) => [one.name, one.places]));
    expect(places).toEqual({
      card: COMPUTED,
      torn: UNREAD,
      cart: [],
      row: [{ name: "cart", view: COMPUTED }],
    });
    // Neither mark is taken for a placement: only what a source names places an assembly.
    expect(shape.assemblies.find((one) => one.name === "cart")?.placedIn).toEqual(["row"]);
  });

  it("carries what is wrong with the tree, each path from the root", () => {
    const root = project({ "src/api/Prices.ts": "export default {};" });
    mkdirSync(join(root, "src/assemblies/Broken"), { recursive: true });
    mkdirSync(join(root, "src/pages/Lost"), { recursive: true });
    const paths = readShape(root).problems.map((problem) => problem.path);
    expect(paths).toContain("src/assemblies/Broken");
    expect(paths.every((path) => path.startsWith("src/"))).toBe(true);
    expect(paths.length).toBeGreaterThanOrEqual(2);
  });

  it("is an empty project, not a broken one, where nothing has been written yet", () => {
    expect(readShape(mkdtempSync(join(tmpdir(), "shape-empty-")))).toEqual({
      pages: [],
      assemblies: [],
      apis: [],
      settings: {
        remotes: [],
        publicRoutes: [],
        contentSecurityPolicy: null,
        authenticate: false,
        budgets: {},
      },
      renderers: [],
      problems: [],
    });
  });

  // Written beneath the directory it is asked from: there, a root that is not resolved before
  // anything is read is joined to itself, and every file is looked for in the wrong place.
  it("is the same from a root given as a path from where it is asked", () => {
    const beneath = mkdtempSync(join(process.cwd(), "node_modules", ".shape-"));
    try {
      for (const [path, contents] of Object.entries(SHOP)) {
        realIo.write(join(beneath, path), contents);
      }
      const given = relative(process.cwd(), beneath);
      expect(given.startsWith("..") || isAbsolute(given)).toBe(false);
      expect(readShape(given)).toEqual(readShape(beneath));
      expect(readShape(given).pages.map((page) => page.template)).toEqual([
        "src/pages/about/about.html",
        "src/pages/home/home.html",
      ]);
    } finally {
      rmSync(beneath, { recursive: true, force: true });
    }
  });

  it("is what JSON carries whole", () => {
    const shape = readShape(project(SHOP));
    expect(JSON.parse(JSON.stringify(shape))).toEqual(shape);
  });
});

// A project is its root. An agent is shown what the shape reads, so a link under the root that
// leads out of it, and an import that climbs out, are not followed: each reads as unread, with
// the rule that says why, and nothing of what stood outside is in the answer.
describe("a project with links that lead out of it", () => {
  const RULE = "a-project-stays-inside-its-root";
  const everywhere = (): string => {
    const { root, outside } = linkedProject(SHOP, {
      "src/pages/home/home.page.ts": "outside:secret.page.ts",
      "src/pages/landing": "outside:pagedir",
      "src/api/prices.api.ts": "outside:secret.api.ts",
      "assemblejs.config.ts": "outside:secret.config.ts",
      "src/assemblies/stolen": "outside:asm",
      "src/assemblies/shell/shell.html": "outside:asm/stolen.html",
    });
    const view = join(root, "src/assemblies/cart/cart.react.tsx");
    const climbing = relative(join(view, ".."), join(outside, "row.tsx")).split("\\").join("/");
    realIo.write(
      view,
      `${REACT}import { Row } from "${climbing}";\nexport default () => <><Row /><Slot name="price" /></>;`,
    );
    return root;
  };

  it("tells nothing of what a link or an import leads out to", () => {
    const told = JSON.stringify(readShape(everywhere()));
    expect(told).not.toMatch(/SECRET|secret-/);
  });

  it("marks each as unread, lists no directory that is one, and says which rule each breaks", () => {
    const shape = readShape(everywhere());
    expect(shape.pages.map((page) => [page.name, page.route, page.policy])).toEqual([
      ["about", "/about", {}],
      ["home", UNREAD, UNREAD],
    ]);
    expect(shape.apis).toEqual([
      { file: "src/api/prices.api.ts", path: UNREAD, method: UNREAD, streams: UNREAD },
    ]);
    expect(shape.settings).toMatchObject({ file: "assemblejs.config.ts", budgets: UNREAD });
    expect(shape.assemblies.map((assembly) => [assembly.name, assembly.places])).toEqual([
      ["cart", [{ name: "price", view: "default" }]],
      ["price", []],
      ["shell", UNREAD],
    ]);
    expect(
      shape.problems.filter((problem) => problem.rule === RULE).map((problem) => problem.path),
    ).toEqual([
      "src/assemblies/shell/shell.html",
      "src/assemblies/stolen",
      "src/pages/home/home.page.ts",
      "src/pages/landing",
      "src/api/prices.api.ts",
      "assemblejs.config.ts",
      "src/assemblies/cart/cart.react.tsx",
    ]);
  });

  it("still reads a link that stays inside the project, and a link to a link that does", () => {
    const { root } = linkedProject(
      { ...SHOP, "src/shared/second.ts": 'export default { route: "/store" };' },
      {
        "src/shared/first.ts": "second.ts",
        "src/pages/home/home.page.ts": "../../shared/first.ts",
      },
    );
    const shape = readShape(root);
    expect(shape.pages.find((page) => page.name === "home")?.route).toBe("/store");
    expect(shape.problems).toEqual([]);
  });

  it("follows a link to a link that leads out, and refuses it where the project names it", () => {
    const { root } = linkedProject(SHOP, {
      "src/shared/first.ts": "outside:secret.page.ts",
      "src/pages/home/home.page.ts": "../../shared/first.ts",
    });
    const shape = readShape(root);
    expect(shape.pages.find((page) => page.name === "home")?.route).toBe(UNREAD);
    expect(shape.problems.map((problem) => [problem.path, problem.rule])).toEqual([
      ["src/pages/home/home.page.ts", RULE],
    ]);
    expect(JSON.stringify(shape)).not.toContain("SECRET");
  });
});
