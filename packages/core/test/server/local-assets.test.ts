// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineAssembly, localAssets, renderEnvelope } from "@assemblejs/core";
import type { AssemblyDefinition } from "@assemblejs/core";

const assembly = (name: string, shadow = false): AssemblyDefinition =>
  defineAssembly({
    name,
    views: { default: { renderer: "html", markup: () => "" } },
    assets: { css: [`/${name}.css`], js: [`/${name}.js`] },
    ...(shadow ? { shadow: true } : {}),
  });
const all = new Map(
  [assembly("shell"), assembly("cart"), assembly("price"), assembly("card", true)].map((one) => [
    one.name,
    one,
  ]),
);
/** An envelope as the server writes one, around whatever was composed inside it. */
const envelope = (name: string, inside = "", remote?: string): string =>
  renderEnvelope({
    id: `id-${name}`,
    name,
    view: "default",
    renderer: "html",
    markup: inside,
    data: {},
    ...(remote === undefined ? {} : { remote }),
    ...(all.get(name)?.shadow === true && remote === undefined ? { shadow: { css: [] } } : {}),
  });

describe("the browser files markup needs linked around it", () => {
  it("are those of every assembly of this server in an envelope in it, at any depth", () => {
    const page = `<body>${envelope("shell", `<section>${envelope("cart", envelope("price"))}</section>`)}</body>`;
    expect(localAssets(page, all)).toEqual({
      css: ["/shell.css", "/cart.css", "/price.css"],
      js: ["/shell.js", "/cart.js", "/price.js"],
    });
  });

  it("are read from the markup alone, so the same page links the same files however it was composed", () => {
    const page = envelope("shell", envelope("cart"));
    expect(localAssets(`<main>${page}</main>${page}`, all).css).toEqual([
      "/shell.css",
      "/cart.css",
      "/shell.css",
      "/cart.css",
    ]);
    expect(localAssets("<main><p>no assemblies</p></main>", all)).toEqual({ css: [], js: [] });
  });

  it("leave a shadow assembly's stylesheets, and those of everything inside it, to its root", () => {
    const page = envelope("card", envelope("cart", envelope("price"))) + envelope("shell");
    // The modules of all of them are the page's; the sheets of what sits in the root are not.
    expect(localAssets(page, all)).toEqual({
      css: ["/shell.css"],
      js: ["/card.js", "/cart.js", "/price.js", "/shell.js"],
    });
  });

  it("leave another server's envelope, and everything inside it, to that server's manifest", () => {
    const theirs = envelope(
      "cart",
      envelope("price", "", "https://b.example"),
      "https://b.example",
    );
    // A name this server also has is still theirs while it sits inside their envelope.
    expect(localAssets(theirs + envelope("shell"), all)).toEqual({
      css: ["/shell.css"],
      js: ["/shell.js"],
    });
  });

  it("pass over an envelope that is only written in a comment or in a script", () => {
    const quoted = `<!-- ${envelope("cart")} --><script>const s = '<assembly-root data-name="price">';</script>`;
    expect(localAssets(quoted + envelope("shell"), all)).toEqual({
      css: ["/shell.css"],
      js: ["/shell.js"],
    });
  });

  it("link nothing for a name no assembly of this server answers to, and read on past it", () => {
    const page = envelope("gone", envelope("cart")) + envelope("price");
    expect(localAssets(page, all).css).toEqual(["/cart.css", "/price.css"]);
  });
});
