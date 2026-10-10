// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fillDeferred } from "@assemblejs/core/client";

const placeholder = (fallback = "", attributes = ""): Element => {
  document.body.innerHTML = `<assembly-root data-name="cart" data-id="a1" data-view="default" data-renderer="" data-defer=""${attributes}>${fallback}<script type="application/json" data-assembly="a1">{}</script></assembly-root>`;
  const element = document.querySelector("assembly-root");
  if (element === null) throw new Error("no placeholder");
  return element;
};
const answer = (body: string, status = 200, type = "text/html; charset=utf-8") =>
  vi.fn(async () => new Response(body, { status, headers: { "content-type": type } }));
const fill = (element: Element) => fillDeferred(element, new AbortController().signal);
const content =
  '<assembly-root data-name="cart" data-id="a1" data-view="default" data-renderer="html"><p>cart</p></assembly-root>';

afterEach(() => {
  vi.unstubAllGlobals();
  history.replaceState(null, "", "/");
});

describe("filling a deferred placement", () => {
  it("asks its own server by its id with the page's query, and puts the envelope in its place", async () => {
    history.replaceState(null, "", "/later?q=hello");
    const fetched = answer(content);
    vi.stubGlobal("fetch", fetched);
    const filled = await fill(placeholder());
    expect(fetched).toHaveBeenCalledWith(
      "/assembly/cart/default/?q=hello",
      // One level deep, as the page's own composer asks a placement it renders itself.
      expect.objectContaining({ headers: { "assembly-id": "a1", "assembly-depth": "1" } }),
    );
    expect(filled?.hasAttribute("data-defer")).toBe(false);
    expect(document.body.innerHTML).toContain("<p>cart</p>");
    expect(document.querySelectorAll("assembly-root")).toHaveLength(1);
  });

  it("shows the server's failed envelope, its logged id, holding the page's fallback", async () => {
    vi.stubGlobal(
      "fetch",
      answer('<assembly-root data-name="cart" data-id="a1" data-failed="c1"></assembly-root>', 500),
    );
    const shown = await fill(placeholder("<template data-fallback><p>stand-in</p></template>"));
    expect(shown?.getAttribute("data-failed")).toBe("c1");
    expect(document.body.innerHTML).toContain("<p>stand-in</p>");
    expect(document.querySelectorAll("assembly-root[data-defer]")).toHaveLength(0);
  });

  it("marks itself failed, showing its fallback, for any answer it cannot read", async () => {
    for (const fetched of [
      answer(content, 404),
      answer('{"not":"html"}', 200, "application/json"),
      answer('<assembly-root data-id="someone-else"><p>x</p></assembly-root>'),
      answer('<div data-id="a1"><p>not an envelope</p></div>'),
      answer(`${content}<p>and more</p>`),
      vi.fn(async () => {
        throw new TypeError("network down");
      }),
    ]) {
      vi.stubGlobal("fetch", fetched);
      const shown = await fill(placeholder("<template data-fallback><p>stand-in</p></template>"));
      expect(shown?.getAttribute("data-failed")).toBe("");
      expect(shown?.hasAttribute("data-defer")).toBe(false);
      expect(shown?.innerHTML).toBe("<p>stand-in</p>");
    }
  });

  it("gives up silently when it is told to stop", async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        controller.abort();
        throw new DOMException("aborted", "AbortError");
      }),
    );
    await expect(fillDeferred(placeholder(), controller.signal)).rejects.toThrow();
    expect(document.querySelector("assembly-root")?.hasAttribute("data-defer")).toBe(true);
  });

  it("sends the page's parameters its placeholder carries, as the header a parent would send", async () => {
    const fetched = answer(content);
    vi.stubGlobal("fetch", fetched);
    await fill(placeholder("", ' data-params="id=42&amp;slug=a+b"'));
    expect(fetched).toHaveBeenCalledWith(
      "/assembly/cart/default/",
      expect.objectContaining({
        headers: {
          "assembly-id": "a1",
          "assembly-depth": "1",
          "assembly-params": "id=42&slug=a+b",
        },
      }),
    );
  });
});
