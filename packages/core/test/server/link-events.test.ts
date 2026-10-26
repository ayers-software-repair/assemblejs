// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { linkEvents } from "@asmjs/core";

const page = "<html><head><title>t</title></head><body><p>hi</p></body></html>";

// R-14: a page names, in its head, the remote servers whose runtimes join its bus, as the
// project's config declares them with `events: true`, and nothing when it declares none.
describe("naming the remotes a page's bus admits", () => {
  it("writes one meta element at the end of the head, the origins space-separated", () => {
    expect(linkEvents(page, ["https://b.example", "https://c.example:8443"])).toBe(
      '<html><head><title>t</title><meta name="assemblejs-events" content="https://b.example https://c.example:8443"></head><body><p>hi</p></body></html>',
    );
  });

  it("leaves a page as it is when no remote joins", () => {
    expect(linkEvents(page, [])).toBe(page);
  });

  it("escapes what it writes, so an origin cannot close the attribute", () => {
    expect(linkEvents(page, ['https://b.example"'])).toContain('content="https://b.example&quot;"');
  });
});
