// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { loadMarkdown } from "@assemblejs/renderer-templates";

describe("a Markdown view", () => {
  it("renders the author's prose", async () => {
    const html = (await loadMarkdown())("# Title\n\nSome *words*.")({ data: {}, children: {} });
    expect(html).toBe("<h1>Title</h1>\n<p>Some <em>words</em>.</p>\n");
  });

  it("shows HTML written inside it as text", async () => {
    const html = (await loadMarkdown())("<script>alert(1)</script>")({ data: {}, children: {} });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
