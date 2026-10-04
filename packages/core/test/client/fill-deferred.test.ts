// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fillDeferred } from "@assemblejs/core/client";

const placeholder = (): Element => {
  document.body.innerHTML =
    '<assembly-root data-name="cart" data-id="a1" data-view="default" data-renderer="" data-defer=""></assembly-root>';
  const element = document.querySelector("assembly-root");
  if (element === null) throw new Error("no placeholder");
  return element;
};
const answer = (body: string, status = 200, type = "text/html; charset=utf-8") =>
  vi.fn(async () => new Response(body, { status, headers: { "content-type": type } }));

afterEach(() => vi.unstubAllGlobals());

describe("filling a deferred placement", () => {
  it("asks its own server's content endpoint by its id, and puts the envelope in its place", async () => {
    const fetched = answer(
      '<assembly-root data-name="cart" data-id="a1" data-view="default" data-renderer="html"><p>cart</p></assembly-root>',
    );
    vi.stubGlobal("fetch", fetched);
    const filled = await fillDeferred(placeholder(), new AbortController().signal);
    expect(fetched).toHaveBeenCalledWith(
      "/assembly/cart/default/",
      expect.objectContaining({
        headers: { "assembly-id": "a1" },
      }),
    );
    expect(filled?.hasAttribute("data-defer")).toBe(false);
    expect(document.body.innerHTML).toContain("<p>cart</p>");
    expect(document.querySelectorAll("assembly-root")).toHaveLength(1);
  });

  it("leaves the placeholder for a failure, a body that is not html, or another id", async () => {
    for (const fetched of [
      answer('<assembly-root data-id="a1" data-failed="c1"></assembly-root>', 500),
      answer('{"not":"html"}', 200, "application/json"),
      answer('<assembly-root data-id="someone-else"><p>x</p></assembly-root>'),
      answer('<assembly-root data-id="a1"></assembly-root><p>and more</p>'),
    ]) {
      vi.stubGlobal("fetch", fetched);
      expect(await fillDeferred(placeholder(), new AbortController().signal)).toBeUndefined();
      expect(document.querySelector("assembly-root")?.hasAttribute("data-defer")).toBe(true);
    }
  });
});
