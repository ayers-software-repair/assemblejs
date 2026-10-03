// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
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
});
