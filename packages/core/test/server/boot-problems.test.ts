// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { bootProblems, defineApi, defineService } from "@asmjs/core";
import type { AssemblyView } from "@asmjs/core";

const view: AssemblyView = { renderer: "html", data: () => ({}), markup: () => "" };

describe("what is checked before anything listens", () => {
  it("passes a well formed set", () => {
    expect(bootProblems([{ name: "cart", views: { default: view } }])).toEqual([]);
  });

  it("refuses an assembly with no default view", () => {
    const problems = bootProblems([{ name: "cart", views: { compact: view } }]);
    expect(problems.join()).toMatch(/no "default" view/);
  });

  it("refuses a duplicate name, which would otherwise be a silent shadow", () => {
    const problems = bootProblems([
      { name: "cart", views: { default: view } },
      { name: "cart", views: { default: view } },
    ]);
    expect(problems.join()).toMatch(/declared more than once/);
  });

  it("refuses a name that is not a usable url segment", () => {
    for (const name of ["Cart", "../etc/passwd", "cart name", "1cart", ""]) {
      expect(bootProblems([{ name, views: { default: view } }]).join()).toMatch(/url segment/);
    }
  });

  it("refuses a view name that is not a usable url segment", () => {
    const problems = bootProblems([{ name: "cart", views: { default: view, "../x": view } }]);
    expect(problems.join()).toMatch(/url segment/);
  });

  it("reports every problem, not the first", () => {
    expect(bootProblems([{ name: "Cart", views: { compact: view } }]).length).toBe(2);
  });

  it("includes what is wrong with the apis, beside what is wrong with the assemblies", () => {
    const problems = bootProblems(
      [{ name: "cart", views: { default: view } }],
      [defineApi({ path: "/_assemblejs/x", handle: () => ({}) })],
    );
    expect(problems.join()).toMatch(/reserves/);
  });

  it("refuses a view whose contributors both declare one data field", () => {
    const service = (name: string) =>
      defineService({ name, schema: { properties: { title: {} } }, run: () => ({ title: name }) });
    const problems = bootProblems([
      { name: "cart", views: { default: { ...view, services: [service("a"), service("b")] } } },
    ]);
    expect(problems.join()).toMatch(/assembly "cart" view "default": data field "title"/);
  });

  // The order is settled per request, so each of these booted and then failed every request.
  it("refuses services that cannot be ordered, naming the assembly and the view", () => {
    const service = (name: string, after?: readonly string[]) =>
      defineService({ name, ...(after === undefined ? {} : { after }), run: () => ({}) });
    const problems = (services: NonNullable<AssemblyView["services"]>) =>
      bootProblems([{ name: "cart", views: { default: { ...view, services } } }]).join("\n");
    expect(problems([service("a"), service("a")])).toContain(
      'assembly "cart" view "default": service "a" is declared more than once',
    );
    expect(problems([service("a", ["zz"])])).toContain(
      'assembly "cart" view "default": service "a" must follow "zz", which is not declared',
    );
    expect(problems([service("a", ["b"]), service("b", ["a"])])).toContain(
      'assembly "cart" view "default": services depend on each other in a circle: a -> b -> a',
    );
    expect(problems([service("b", ["a"]), service("a")])).toBe("");
  });

  // "constructor" is a usable url segment, so a view may be named it; every object has one too.
  it("reads a view named after what every object has as the view it is, beside ones that place", () => {
    const shell = { ...view, placements: [{ name: "cart", view: "constructor" }] };
    expect(
      bootProblems([
        { name: "shell", views: { default: shell, constructor: view } },
        { name: "cart", views: { default: view, constructor: view } },
      ]),
    ).toEqual([]);
    expect(bootProblems([{ name: "cart", views: { constructor: view } }]).join()).toMatch(
      /no "default" view/,
    );
  });

  it("refuses what a view's source is known to place when nothing answers to it", () => {
    const placing = (placements: AssemblyView["placements"]): AssemblyView => ({
      ...view,
      ...(placements === undefined ? {} : { placements }),
    });
    const problems = bootProblems([
      {
        name: "shell",
        views: { default: placing([{ name: "nope" }, { name: "cart", view: "wide" }]) },
      },
      { name: "cart", views: { default: placing([{ name: "cart", view: "default" }]) } },
      { name: "odd", views: { default: placing([{ name: "Not A Segment" }]) } },
    ]).join("\n");
    expect(problems).toContain(
      'assembly "shell" view "default" places "nope", and there is no such',
    );
    expect(problems).toContain('assembly "shell" view "default" places "cart" with a view "wide"');
    expect(problems).toContain('assembly "cart" view "default" places itself');
    expect(problems).toContain('places "Not A Segment", which is not a usable url segment');
  });

  it("includes what is wrong with the pages", () => {
    const problems = bootProblems(
      [{ name: "cart", views: { default: view } }],
      [],
      [{ route: "/", template: '<assembly name="nope"></assembly>' }],
    );
    expect(problems.join()).toMatch(/no such assembly/);
  });
});
