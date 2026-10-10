// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { discoverAssemblies, viewFindings } from "@assemblejs/cli";
import { linkedProject } from "../fixtures/linked-project.js";
import { templatedProject } from "../fixtures/templated-project.js";

const findings = (files: Record<string, string>) => {
  const root = mkdtempSync(join(tmpdir(), "view-findings-"));
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(join(root, "src/assemblies", path, ".."), { recursive: true });
    writeFileSync(join(root, "src/assemblies", path), contents);
  }
  return viewFindings(root, discoverAssemblies(root).assemblies);
};
const REACT = 'import { Slot } from "@assemblejs/renderer-react/client";\n';
// The same, in a project that has the templates renderer installed, and so a Pug of its own.
const made: string[] = [];
afterAll(() => {
  for (const root of made) rmSync(root, { recursive: true, force: true });
});
const templated = (files: Record<string, string>) => {
  const root = templatedProject(
    made,
    Object.fromEntries(
      Object.entries(files).map(([path, contents]) => [`src/assemblies/${path}`, contents]),
    ),
  );
  return viewFindings(root, discoverAssemblies(root).assemblies);
};

describe("what every view in a project says it places", () => {
  it("is each view's placements by its assembly's name, a view only its render knows left out", () => {
    const { placements, problems } = findings({
      "shell/shell.html": '<assembly name="cart"></assembly>',
      "cart/cart.react.tsx": `${REACT}export default () => <Slot name="price" view="compact" />;`,
      "price/price.html": "<p>price</p>",
      // With no templates renderer installed there is no Pug to read this one with.
      "card/card.pug": 'assembly(name="cart")',
    });
    expect(problems).toEqual([]);
    expect(Object.fromEntries(placements)).toEqual({
      shell: [{ name: "cart", view: "default" }],
      cart: [{ name: "price", view: "compact" }],
      price: [],
    });
  });

  it("reads a Pug view with the project's own Pug, where its templates renderer is installed", () => {
    const { placements, problems } = templated({
      "card/card.pug": 'section\n  assembly(name="cart")\n  assembly(name=data.which)',
      "cart/cart.html": "<p>cart</p>",
    });
    expect(placements.get("card")).toEqual([{ name: "cart", view: "default" }]);
    expect(problems).toMatchObject([
      {
        rule: "a-placement-is-named-where-it-is-written",
        path: expect.stringMatching(/card\.pug$/),
      },
    ]);
  });

  // Passed over, such a view passed check and failed whole at its first render.
  it("reports a directive a template writes that does not read, in each language", () => {
    const { placements, problems, unread } = templated({
      "open/open.ejs": '<assembly name="cart"><p><%= data.n %></p>',
      "torn/torn.hbs": '{{data.n}}<assembly name="cart" timeout="5"></assembly>',
      "worded/worded.pug": 'assembly(name="cart") words',
    });
    expect(problems.map((problem) => problem.rule)).toEqual(
      Array(3).fill("a-placement-names-an-assembly"),
    );
    expect(problems[0]?.message).toContain(
      '"open" holds a placement that cannot be read: once what the template computes is set aside, <assembly> is neither',
    );
    expect([...unread].sort()).toEqual(["open", "torn", "worded"]);
    expect(placements.size).toBe(0);
  });

  // What the template computes may be what makes it read: that view is its render's to tell
  // of, with no record and no finding.
  it("passes over a directive that does not read for what the template computes in it", () => {
    const { placements, problems, unread } = templated({
      "wide/wide.hbs": '<assembly name="cart" {{#if x}}view="wide"{{/if}}></assembly>',
      "cart/cart.html": "<p>cart</p>",
    });
    expect(problems).toEqual([]);
    expect(placements.has("wide")).toBe(false);
    expect(unread.size).toBe(0);
  });

  it("reports a directive that cannot be read, where it is written", () => {
    const { placements, problems } = findings({
      "shell/shell.html": '<assembly name="cart" timeout="5"></assembly>',
    });
    expect(placements.has("shell")).toBe(false);
    expect(problems).toMatchObject([{ rule: "a-placement-names-an-assembly" }]);
    expect(problems[0]?.message).toContain('"shell" holds a placement that cannot be read');
    expect(problems[0]?.path).toMatch(/shell\/shell\.html$/);
  });

  it("reports a placement whose name is computed, and one no assembly could be named", () => {
    const { placements, problems } = findings({
      "shell/shell.react.tsx": `${REACT}export default (props: { which: string }) => <><Slot name={props.which} /><Slot name="Cart" /><Slot name="price" /></>;`,
    });
    expect(problems.map((problem) => problem.rule)).toEqual([
      "a-placement-is-named-where-it-is-written",
      "a-placement-names-an-assembly",
    ]);
    expect(problems[1]?.message).toContain('places "Cart"');
    // What could be read and named still stands.
    expect(placements.get("shell")).toEqual([{ name: "price", view: "default" }]);
  });

  // A slot is the view's wherever its author wrote it: in the view's file, or in a component
  // the view is split into.
  it("reads the slots of the components a framework view is split into", () => {
    const { placements, problems } = findings({
      "shell/shell.react.tsx":
        'import { Panel } from "./panel.js";\nexport default () => <Panel />;',
      "shell/panel.tsx": `${REACT}export const Panel = (props: { which: string }) => <><Slot name="cart" /><Slot name={props.which} /></>;`,
      "board/board.svelte":
        '<script lang="ts">\n  import Row from "./Row.svelte";\n</script>\n<Row />',
      "board/Row.svelte":
        '<script lang="ts">\n  import { slot } from "@assemblejs/renderer-svelte/client";\n</script>\n<div>{@html slot("price")}</div>',
    });
    expect(placements.get("shell")).toEqual([{ name: "cart", view: "default" }]);
    expect(placements.get("board")).toEqual([{ name: "price", view: "default" }]);
    expect(problems).toMatchObject([
      {
        rule: "a-placement-is-named-where-it-is-written",
        path: expect.stringMatching(/shell\.react\.tsx$/),
      },
    ]);
  });

  // Nothing outside the project is read for what it places.
  it("names a view that leads out among the unread, and says nothing of what stood there", () => {
    const { root } = linkedProject(
      { "src/assemblies/cart/cart.html": "<p>cart</p>" },
      { "src/assemblies/shell/shell.html": "outside:asm/stolen.html" },
    );
    const { placements, problems, unread } = viewFindings(
      root,
      discoverAssemblies(root).assemblies,
    );
    expect([...unread]).toEqual(["shell"]);
    expect(placements.has("shell")).toBe(false);
    // That it leads out is the tree's to report, where the project names the file.
    expect(problems).toEqual([]);
  });

  it("reports an import that leads out of the project, and reads the rest of the view", () => {
    const { root } = linkedProject(
      {
        "src/assemblies/shell/shell.react.tsx": `${REACT}import { Row } from "../../../../outside/row.js";\nexport default () => <><Row /><Slot name="cart" /></>;`,
      },
      {},
    );
    const { placements, problems } = viewFindings(root, discoverAssemblies(root).assemblies);
    expect(placements.get("shell")).toEqual([{ name: "cart", view: "default" }]);
    expect(problems).toEqual([
      {
        path: expect.stringMatching(/shell\.react\.tsx$/) as unknown as string,
        rule: "a-project-stays-inside-its-root",
        message:
          '"shell" imports ../../../../outside/row.js, which is outside the project, so what it places is not read',
        fix: "move the component into the project, or import it by a package's name",
      },
    ]);
  });
});
