// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { scheduleFill, start } from "@assemblejs/core/client";
import type { ClientRenderer } from "@assemblejs/core/client";

const island = (id: string) =>
  `<script type="application/json" data-assembly="${id}">${JSON.stringify({ id, name: "cart", view: "default", renderer: "html", data: { n: 1 }, deferred: false })}</script>`;
const filledWith = `<assembly-root data-name="cart" data-id="a1" data-view="default" data-renderer="html"><p>cart</p>${island("a1")}</assembly-root>`;
const placeholder = () => {
  document.body.innerHTML =
    '<assembly-root data-name="cart" data-id="a1" data-view="default" data-renderer="" data-defer=""></assembly-root>';
  return document.querySelector("assembly-root") as Element;
};

afterEach(() => vi.unstubAllGlobals());

describe("scheduling a deferred fill", () => {
  it("fills once the page has loaded, and hands over the envelope that took its place", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(filledWith, { headers: { "content-type": "text/html" } })),
    );
    const filled = await new Promise<Element>((resolve) => scheduleFill(placeholder(), resolve));
    expect(filled.querySelector("p")?.textContent).toBe("cart");
  });

  it("asks for nothing once cancelled", async () => {
    const fetched = vi.fn(async () => new Response(filledWith));
    vi.stubGlobal("fetch", fetched);
    Object.defineProperty(document, "readyState", { value: "loading", configurable: true });
    const cancel = scheduleFill(placeholder(), () => undefined);
    cancel();
    window.dispatchEvent(new Event("load"));
    expect(fetched).not.toHaveBeenCalled();
    Object.defineProperty(document, "readyState", { value: "complete", configurable: true });
  });

  it("is how the runtime mounts a deferred assembly: filled, then mounted like any other", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(filledWith, { headers: { "content-type": "text/html" } })),
    );
    placeholder();
    const mounted: unknown[] = [];
    const html: ClientRenderer = {
      mount: (_element, data) => {
        mounted.push(data);
        return { unmount: () => undefined };
      },
    };
    const runtime = start({ renderers: { html }, replay: [] });
    await vi.waitFor(() => expect(mounted).toEqual([{ n: 1 }]));
    expect(runtime.mounted.has("a1")).toBe(true);
    runtime.unmountAll();
  });

  it("hands nothing over when cancelled after the answer is on its way", async () => {
    let release: (response: Response) => void = () => undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>((resolve) => (release = resolve))),
    );
    const filled = vi.fn();
    const cancel = scheduleFill(placeholder(), filled);
    cancel();
    release(new Response(filledWith, { headers: { "content-type": "text/html" } }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(filled).not.toHaveBeenCalled();
  });

  it("mounts what the filled envelope holds, and asks for each placeholder once", async () => {
    const inner = `<assembly-root data-name="row" data-id="b1" data-view="default" data-renderer="html">${island("b1")}</assembly-root>`;
    const fetched = vi.fn(
      async () =>
        new Response(filledWith.replace("</assembly-root>", `${inner}</assembly-root>`), {
          headers: { "content-type": "text/html" },
        }),
    );
    vi.stubGlobal("fetch", fetched);
    placeholder();
    const mounted: string[] = [];
    const html: ClientRenderer = {
      mount: (_element, _data, context) => {
        mounted.push(context.id);
        return { unmount: () => undefined };
      },
    };
    const runtime = start({ renderers: { html }, replay: [] });
    runtime.mount(document);
    await vi.waitFor(() => expect(mounted.sort()).toEqual(["a1", "b1"]));
    expect(fetched).toHaveBeenCalledTimes(1);
    runtime.unmountAll();
  });
});
