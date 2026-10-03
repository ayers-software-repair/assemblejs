// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadNunjucks } from "@assemblejs/renderer-templates";

const input = {
  data: { name: '<b>"Ann" & co</b>' },
  children: { inner: '<p class="child">from another renderer</p>' },
};

describe("a Nunjucks template", () => {
  it("escapes a value from data", async () => {
    const html = (await loadNunjucks())("<p>{{ data.name }}</p>")(input);
    expect(html).toContain("&lt;b&gt;");
    expect(html).not.toContain("<b>");
  });

  it("writes a child's HTML as it is", async () => {
    expect((await loadNunjucks())("<div>{{ children.inner }}</div>")(input)).toContain(
      '<p class="child">from another renderer</p>',
    );
  });

  it("throws on a template it cannot read", async () => {
    const compile = await loadNunjucks();
    expect(() => compile("{% if %}")(input)).toThrow();
  });

  it("refuses to reach another file, even one that is there", async () => {
    const other = join(mkdtempSync(join(tmpdir(), "other-")), "other.njk");
    writeFileSync(other, "leaked");
    const compile = await loadNunjucks();
    let html = "";
    expect(() => (html = compile(`{% include ${JSON.stringify(other)} %}`)(input))).toThrow();
    expect(html).not.toContain("leaked");
  });

  // Given no loaders, Nunjucks reads templates from views/ under the working directory.
  it("reads nothing from a views directory where the server runs", async () => {
    const root = mkdtempSync(join(tmpdir(), "cwd-"));
    mkdirSync(join(root, "views"));
    writeFileSync(join(root, "views", "x.njk"), "leaked");
    const compile = await loadNunjucks();
    const before = process.cwd();
    process.chdir(root);
    try {
      for (const source of [
        "{% include 'x.njk' %}",
        "{% extends 'x.njk' %}",
        "{% import 'x.njk' as m %}hi",
        `{% include ${JSON.stringify(join(root, "views", "x.njk"))} %}`,
      ]) {
        expect(() => compile(source)(input), source).toThrow(/template not found/);
      }
    } finally {
      process.chdir(before);
    }
  });
});
