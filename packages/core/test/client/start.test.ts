// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { start } from "@assemblejs/core/client";
import type { ClientRenderer } from "@assemblejs/core/client";

const envelope = (
  id: string,
  over: { renderer?: string; mount?: string; data?: unknown; island?: boolean } = {},
): string => {
  const payload = JSON.stringify({
    id,
    name: id,
    view: "default",
    renderer: over.renderer ?? "html",
    data: over.data ?? { which: id },
    deferred: false,
  });
  const island =
    over.island === false
      ? ""
      : `<script type="application/json" data-assembly="${id}">${payload}</script>`;
  const mount = over.mount === undefined ? "" : ` data-mount="${over.mount}"`;
  return `<assembly-root data-id="${id}" data-name="${id}" data-view="default" data-renderer="${over.renderer ?? "html"}"${mount}>${island}</assembly-root>`;
};

const recorder = () => {
  const mounts: string[] = [];
  const unmounts: string[] = [];
  const renderer: ClientRenderer = {
    mount: (element, _data, context) => {
      mounts.push(context.name);
      void element;
      return { unmount: () => unmounts.push(context.name) };
    },
  };
  return { mounts, unmounts, renderer };
};

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("starting the runtime", () => {
  it("mounts every assembly through the renderer its envelope declares", () => {
    document.body.innerHTML = envelope("a") + envelope("b");
    const { mounts, renderer } = recorder();
    const runtime = start({ renderers: { html: renderer } });
    expect(mounts).toEqual(["a", "b"]);
    expect(runtime.mounted.size).toBe(2);
  });

  it("mounts an outer assembly before the one nested inside it", () => {
    document.body.innerHTML = `<assembly-root data-id="outer" data-name="outer" data-view="default" data-renderer="html"><script type="application/json" data-assembly="outer">{"id":"outer","name":"outer","view":"default","renderer":"html","data":{},"deferred":false}</script>${envelope("inner")}</assembly-root>`;
    const { mounts, renderer } = recorder();
    start({ renderers: { html: renderer } });
    expect(mounts).toEqual(["outer", "inner"]);
  });

  it("removes every island it read", () => {
    document.body.innerHTML = envelope("a") + envelope("b");
    const { renderer } = recorder();
    start({ renderers: { html: renderer } });
    // An island left behind is re-read by anything that walks the DOM and shown by view-source.
    expect(document.querySelectorAll("script[data-assembly]")).toHaveLength(0);
  });

  it("hands the renderer the island's data and the assembly's identity", () => {
    document.body.innerHTML = envelope("cart", { data: { total: 2 } });
    const seen: Array<{ data: unknown; name: string }> = [];
    start({
      renderers: {
        html: {
          mount: (_element, data, context) => {
            seen.push({ data, name: context.name });
            return { unmount: () => {} };
          },
        },
      },
    });
    expect(seen).toEqual([{ data: { total: 2 }, name: "cart" }]);
  });

  it("never mounts an assembly declared static", () => {
    document.body.innerHTML = envelope("a", { mount: "none" }) + envelope("b");
    const { mounts, renderer } = recorder();
    start({ renderers: { html: renderer } });
    expect(mounts).toEqual(["b"]);
  });
});

describe("one assembly failing", () => {
  it("is one assembly failing, when its renderer is not registered", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    document.body.innerHTML = envelope("a", { renderer: "svelte" }) + envelope("b");
    const { mounts, renderer } = recorder();
    start({ renderers: { html: renderer } });
    expect(mounts).toEqual(["b"]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("is one assembly failing, when its mount throws", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    document.body.innerHTML = envelope("a") + envelope("b");
    const mounts: string[] = [];
    start({
      renderers: {
        html: {
          mount: (_element, _data, context) => {
            if (context.name === "a") throw new Error("boom");
            mounts.push(context.name);
            return { unmount: () => {} };
          },
        },
      },
    });
    // A page where one broken island takes the rest down is worse than no runtime at all.
    expect(mounts).toEqual(["b"]);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it("is one assembly failing, when its island is malformed", () => {
    document.body.innerHTML =
      `<assembly-root data-id="a" data-renderer="html"><script type="application/json" data-assembly="a">{ not json</script></assembly-root>` +
      envelope("b");
    const { mounts, renderer } = recorder();
    start({ renderers: { html: renderer } });
    expect(mounts).toEqual(["b"]);
  });

  it("leaves the server's markup in place for the one that failed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    document.body.innerHTML = `<assembly-root data-id="a" data-renderer="nope"><p>from the server</p><script type="application/json" data-assembly="a">{"id":"a","name":"a","view":"default","renderer":"nope","data":{},"deferred":false}</script></assembly-root>`;
    start({ renderers: {} });
    expect(document.body.textContent).toContain("from the server");
    warn.mockRestore();
  });
});

describe("mounting again", () => {
  // Written to exercise the guard and not the side effect. The first version of this test put
  // the island back nowhere and passed even with the guard deleted, because readIsland removes
  // the island and the second pass then found nothing to mount. It was green for a reason it
  // did not claim, which is the same as not testing the guard at all.
  it("does not mount an assembly twice, even when an island is present again", () => {
    document.body.innerHTML = envelope("a");
    const { mounts, renderer } = recorder();
    const runtime = start({ renderers: { html: renderer } });
    expect(mounts).toEqual(["a"]);

    const element = document.querySelector(`assembly-root[data-id="a"]`);
    element?.insertAdjacentHTML(
      "beforeend",
      `<script type="application/json" data-assembly="a">{"id":"a","name":"a","view":"default","renderer":"html","data":{},"deferred":false}</script>`,
    );
    runtime.mount(document);
    expect(mounts).toEqual(["a"]);
  });

  it("mounts markup inserted after the runtime started", () => {
    document.body.innerHTML = envelope("a");
    const { mounts, renderer } = recorder();
    const runtime = start({ renderers: { html: renderer } });
    document.body.insertAdjacentHTML("beforeend", envelope("late"));
    runtime.mount(document);
    expect(mounts).toEqual(["a", "late"]);
  });
});

describe("tearing down", () => {
  it("unmounts in reverse, so an inner assembly goes before the outer one", () => {
    document.body.innerHTML = `<assembly-root data-id="outer" data-name="outer" data-view="default" data-renderer="html"><script type="application/json" data-assembly="outer">{"id":"outer","name":"outer","view":"default","renderer":"html","data":{},"deferred":false}</script>${envelope("inner")}</assembly-root>`;
    const { unmounts, renderer } = recorder();
    const runtime = start({ renderers: { html: renderer } });
    runtime.unmountAll();
    expect(unmounts).toEqual(["inner", "outer"]);
    expect(runtime.mounted.size).toBe(0);
  });

  it("keeps going when one teardown throws", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    document.body.innerHTML = envelope("a") + envelope("b");
    const unmounts: string[] = [];
    const runtime = start({
      renderers: {
        html: {
          mount: (_element, _data, context) => ({
            unmount: () => {
              if (context.name === "b") throw new Error("boom");
              unmounts.push(context.name);
            },
          }),
        },
      },
    });
    runtime.unmountAll();
    expect(unmounts).toEqual(["a"]);
    error.mockRestore();
  });
});

describe("the runtime's bus", () => {
  it("gives each assembly an events object scoped to it", () => {
    document.body.innerHTML = envelope("a") + envelope("b");
    const heard: string[] = [];
    const runtime = start({
      renderers: {
        html: {
          mount: (_element, _data, context) => {
            context.events.on("ping", (message) =>
              heard.push(`${context.name}<-${message.from.name}`),
            );
            return { unmount: () => {} };
          },
        },
      },
    });
    // Two assemblies, talking through the page rather than through each other.
    runtime.bus.forAssembly({ id: "x", name: "outside", view: "default" }).events.send("ping", {});
    expect(heard.sort()).toEqual(["a<-outside", "b<-outside"]);
  });

  // The half that makes per-assembly scoping mean anything: without it the events object is
  // just a global with extra steps.
  it("releases every subscription it handed out when it tears down", () => {
    document.body.innerHTML = envelope("a") + envelope("b");
    const runtime = start({
      renderers: {
        html: {
          mount: (_element, _data, context) => {
            context.events.on("t", () => {});
            context.events.on("u", () => {});
            return { unmount: () => {} };
          },
        },
      },
    });
    expect(runtime.bus.size).toBe(4);
    runtime.unmountAll();
    expect(runtime.bus.size).toBe(0);
  });

  it("replays a declared topic to an assembly that mounts after it was sent", () => {
    document.body.innerHTML = "";
    const runtime = start({ renderers: {}, replay: ["cart:add"] });
    runtime.bus
      .forAssembly({ id: "x", name: "catalogue", view: "default" })
      .events.send("cart:add", { sku: "late" });

    document.body.innerHTML = envelope("cart");
    runtime.mount(document);
    const held = runtime.bus.forAssembly({ id: "y", name: "cart", view: "default" });
    expect(held.events.last<{ sku: string }>("cart:add")?.payload).toEqual({ sku: "late" });
  });
});
