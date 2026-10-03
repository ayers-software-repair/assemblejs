// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { hoistAssets } from "@assemblejs/core";

const page = "<!doctype html><html><head><title>t</title></head><body><main></main></body></html>";

describe("linking a page's browser files", () => {
  it("puts stylesheets at the end of the head and modules at the end of the body", () => {
    const html = hoistAssets(page, { css: ["/a.css"], js: ["/c.js"] });
    expect(html).toBe(
      '<!doctype html><html><head><title>t</title><link rel="stylesheet" href="/a.css"></head>' +
        '<body><main></main><script type="module" src="/c.js"></script></body></html>',
    );
  });

  it("links each url once, however many placements need it", () => {
    const html = hoistAssets(page, { css: ["/a.css", "/a.css"], js: ["/c.js", "/c.js"] });
    expect(html.match(/c\.js/g)?.length).toBe(1);
    expect(html.match(/a\.css/g)?.length).toBe(1);
  });

  it("leaves a page with nothing to link untouched", () => {
    expect(hoistAssets(page, { css: [], js: [] })).toBe(page);
  });

  it("still links into a template with no head or body", () => {
    expect(hoistAssets("<main></main>", { css: ["/a.css"], js: ["/c.js"] })).toBe(
      '<link rel="stylesheet" href="/a.css"><main></main><script type="module" src="/c.js"></script>',
    );
  });

  it("uses the last closing body tag, not one quoted earlier in the document", () => {
    const quoted = "<body><pre>&lt;/body&gt; </body></pre></body>";
    expect(
      hoistAssets(quoted, { css: [], js: ["/c.js"] }).endsWith(
        '<script type="module" src="/c.js"></script></body>',
      ),
    ).toBe(true);
  });

  it("encodes a url so it cannot end the attribute it sits in", () => {
    const html = hoistAssets("<body></body>", { css: [], js: ['/c.js" onload="x'] });
    expect(html).not.toContain('" onload="');
  });
});
