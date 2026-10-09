// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadPug } from "@assemblejs/renderer-templates";

const input = {
  data: { name: '<b>"Ann" & co</b>' },
  children: { inner: '<p class="child">from another renderer</p>' },
};

describe("a Pug template", () => {
  it("escapes a value from data", async () => {
    const html = (await loadPug())("p= data.name")(input);
    expect(html).toContain("&lt;b&gt;");
    expect(html).not.toContain("<b>");
  });

  it("writes a child's HTML as it is", async () => {
    expect((await loadPug())("div!= children.inner")(input)).toContain(
      '<p class="child">from another renderer</p>',
    );
  });

  it("throws on a template it cannot read", async () => {
    const compile = await loadPug();
    expect(() => compile("p(class=")(input)).toThrow();
  });

  it("refuses to reach another file, even one that is there", async () => {
    const other = join(mkdtempSync(join(tmpdir(), "other-")), "other.pug");
    writeFileSync(other, "leaked");
    const compile = await loadPug();
    let html = "";
    expect(() => (html = compile(`include ${other}`)(input))).toThrow();
    expect(html).not.toContain("leaked");
  });
});
