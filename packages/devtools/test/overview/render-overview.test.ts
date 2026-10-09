// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { renderOverview } from "@assemblejs/devtools";
import { view } from "../fixtures/view.js";

describe("the devtools overview", () => {
  it("shows what the server was built from", () => {
    const html = renderOverview(view());
    for (const text of ["cart", "default (react)", "/api/prices", "https://shop.example.com"]) {
      expect(html).toContain(text);
    }
    expect(html).toContain('<link rel="stylesheet" href="/_assemblejs/devtools/devtools.css">');
  });

  it("shows each recent failure by its id, escaped, and says when there is none", () => {
    expect(renderOverview(view())).toContain("None since the server started.");
    const html = renderOverview(
      view([{ correlationId: "8f212c16", message: "m", stack: "Error: <script>x</script>" }]),
    );
    expect(html).toContain("<code>8f212c16</code>");
    expect(html).toContain("Error: &lt;script&gt;x&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("escapes every value it shows, a route or a path included", () => {
    const base = view();
    const html = renderOverview({
      ...base,
      project: { ...base.project, pages: [{ route: "/<i>x</i>", stream: undefined }] },
    });
    expect(html).toContain("/&lt;i&gt;x&lt;/i&gt;");
    expect(html).not.toContain("<i>x</i>");
  });

  it("offers no control: no form, no script, no button", () => {
    expect(renderOverview(view())).not.toMatch(/<(form|script|button|input)\b/);
  });
});
