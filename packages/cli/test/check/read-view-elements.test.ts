// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { readViewElements } from "@assemblejs/cli";

const tags = (file: string, renderer: string, source: string) =>
  readViewElements(file, renderer, source)?.map((element) => element.tag);

describe("the elements one file of a view writes, by its kind", () => {
  it("reads html, a template, Vue, Svelte and a module each by its own reader", () => {
    expect(tags("a.html", "html", "<p><img alt=''></p>")).toEqual(["p", "img"]);
    expect(tags("a.ejs", "ejs", "<p><%= x %></p>")).toEqual(["p"]);
    expect(tags("a.md", "markdown", "# h")).toEqual([]);
    expect(tags("a.vue", "vue", "<template><b></b></template>")).toEqual(["b"]);
    expect(tags("a.svelte", "svelte", "<i>{x}</i>")).toEqual(["i"]);
    expect(tags("a.tsx", "react", "export default () => <u />;")).toEqual(["u"]);
  });

  it("leaves to the render what it cannot read: Pug with no Pug, a module that does not compile, a kind it does not know", () => {
    expect(readViewElements("a.pug", "pug", "p hi")).toBeUndefined();
    expect(readViewElements("a.tsx", "react", "export default (")).toBeUndefined();
    expect(readViewElements("a.wasm", "other", "")).toBeUndefined();
  });
});
