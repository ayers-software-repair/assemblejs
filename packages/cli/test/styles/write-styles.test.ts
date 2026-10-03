// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { realIo, writeStyles } from "@assemblejs/cli";
import type { DiscoveredAssembly } from "@assemblejs/cli";

const project = () => {
  const root = mkdtempSync(join(tmpdir(), "styles-"));
  mkdirSync(join(root, "src", "assemblies", "cart"), { recursive: true });
  writeFileSync(join(root, "src", "assemblies", "cart", "cart.css"), ".title { color: red }");
  return root;
};
const assembly = (root: string, styles: string[]): DiscoveredAssembly => ({
  name: "cart",
  directory: join(root, "src", "assemblies", "cart"),
  view: join(root, "src", "assemblies", "cart", "cart.svelte"),
  renderer: "svelte",
  client: undefined,
  service: undefined,
  styles,
});

describe("writing each assembly's stylesheet", () => {
  it("scopes the .css, adds the component's own, and names the file by its content", () => {
    const root = project();
    const found = assembly(root, [join(root, "src", "assemblies", "cart", "cart.css")]);
    const urls = writeStyles(
      root,
      [found],
      new Map([[found.view, "p.svelte-x { margin: 0 }"]]),
      realIo,
    );
    const url = urls.get("cart")?.scoped ?? "";
    expect(url).toMatch(/^\/_assemblejs\/assets\/styles\/cart-[0-9a-f]{8}\.css$/);
    const css = readFileSync(
      join(root, "dist", "client", "styles", url.split("/").at(-1) ?? ""),
      "utf8",
    );
    expect(css).toContain('assembly-root[data-name="cart"] .title');
    expect(css).toContain("p.svelte-x { margin: 0 }");
  });

  it("writes a framework view a second sheet for its shadow root, left unscoped", () => {
    const root = project();
    const found = assembly(root, [join(root, "src", "assemblies", "cart", "cart.css")]);
    const url =
      writeStyles(root, [found], new Map([[found.view, "p.svelte-x { margin: 0 }"]]), realIo).get(
        "cart",
      )?.shadow ?? "";
    expect(url).toMatch(/^\/_assemblejs\/assets\/styles\/cart-[0-9a-f]{8}\.shadow\.css$/);
    const css = readFileSync(
      join(root, "dist", "client", "styles", url.split("/").at(-1) ?? ""),
      "utf8",
    );
    expect(css).toContain(".title { color: red }");
    expect(css).not.toContain("assembly-root");
    expect(css).toContain("p.svelte-x { margin: 0 }");
  });

  it("writes an html view no shadow sheet, because it cannot opt into a shadow root", () => {
    const root = project();
    const found = {
      ...assembly(root, [join(root, "src", "assemblies", "cart", "cart.css")]),
      view: join(root, "src", "assemblies", "cart", "cart.html"),
      renderer: "html",
    };
    expect(writeStyles(root, [found], new Map(), realIo).get("cart")?.shadow).toBeUndefined();
  });

  it("writes nothing, and links nothing, for an assembly with no styles", () => {
    const root = project();
    expect(writeStyles(root, [assembly(root, [])], new Map(), realIo).size).toBe(0);
  });

  it("gives changed styles a new url", () => {
    const root = project();
    const found = assembly(root, [join(root, "src", "assemblies", "cart", "cart.css")]);
    const first = writeStyles(root, [found], new Map(), realIo).get("cart")?.scoped;
    writeFileSync(join(root, "src", "assemblies", "cart", "cart.css"), ".title { color: blue }");
    expect(writeStyles(root, [found], new Map(), realIo).get("cart")?.scoped).not.toBe(first);
  });
});
