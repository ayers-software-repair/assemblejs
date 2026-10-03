// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadEjs } from "@assemblejs/renderer-templates";

const input = {
  data: { name: '<b>"Ann" & co</b>' },
  children: { inner: '<p class="child">from another renderer</p>' },
};

describe("an EJS template", () => {
  it("escapes a value from data", async () => {
    const html = (await loadEjs())("<p><%= data.name %></p>")(input);
    expect(html).toContain("&lt;b&gt;");
    expect(html).not.toContain("<b>");
  });

  it("writes a child's HTML as it is", async () => {
    expect((await loadEjs())("<div><%- children.inner %></div>")(input)).toContain(
      '<p class="child">from another renderer</p>',
    );
  });

  it("throws on a template it cannot read", async () => {
    const compile = await loadEjs();
    expect(() => compile("<% if ( %>")(input)).toThrow();
  });

  it("refuses to reach another file, even one that is there", async () => {
    const other = join(mkdtempSync(join(tmpdir(), "other-")), "other.ejs");
    writeFileSync(other, "leaked");
    const compile = await loadEjs();
    let html = "";
    expect(() => (html = compile(`<%- include(${JSON.stringify(other)}) %>`)(input))).toThrow();
    expect(html).not.toContain("leaked");
  });
});
