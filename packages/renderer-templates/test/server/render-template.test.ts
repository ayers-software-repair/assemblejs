// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from "vitest";
import { loadCompiler, renderTemplate } from "@assemblejs/renderer-templates";

const input = (name: string) => ({ data: { name }, children: { inner: "<i>child</i>" } });

describe("rendering a template", () => {
  it("renders every language with the placement's data escaped and children as HTML", async () => {
    const sources = {
      ejs: "<p><%= data.name %><%- children.inner %></p>",
      handlebars: "<p>{{data.name}}{{children.inner}}</p>",
      nunjucks: "<p>{{ data.name }}{{ children.inner }}</p>",
      pug: "p #{data.name}!{children.inner}",
    } as const;
    for (const [engine, source] of Object.entries(sources)) {
      expect(
        await renderTemplate(engine as keyof typeof sources, source, input("<b>")),
        engine,
      ).toBe("<p>&lt;b&gt;<i>child</i></p>");
    }
    expect(await renderTemplate("markdown", "*hi*", input(""))).toBe("<p><em>hi</em></p>\n");
  });

  it("compiles a template once, and renders it for each placement", async () => {
    const compiler = await loadCompiler("handlebars");
    const compile = vi.fn(compiler);
    const source = "<p>{{data.name}} once</p>";
    vi.doMock("../../src/engine/load-compiler.js", () => ({ loadCompiler: async () => compile }));
    vi.resetModules();
    const fresh = await import("../../src/server/render-template.js");
    expect(await fresh.renderTemplate("handlebars", source, input("a"))).toBe("<p>a once</p>");
    expect(await fresh.renderTemplate("handlebars", source, input("b"))).toBe("<p>b once</p>");
    expect(compile).toHaveBeenCalledTimes(1);
    vi.doUnmock("../../src/engine/load-compiler.js");
  });

  it("throws, every time, for a template that does not compile", async () => {
    await expect(renderTemplate("ejs", "<% if ( %>", input("a"))).rejects.toThrow();
    await expect(renderTemplate("ejs", "<% if ( %>", input("a"))).rejects.toThrow();
  });
});
