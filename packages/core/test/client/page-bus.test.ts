// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { PAGE_BUS_KEY, pageBus } from "@asmjs/core/client";

const REMOTE = "https://b.example";
const OTHER = "https://c.example";
const sender = (id: string) => ({ id, name: "widget", view: "default" });

beforeEach(() => {
  delete (globalThis as Record<symbol, unknown>)[PAGE_BUS_KEY];
  document.head.innerHTML = `<meta name="assemblejs-events" content="${REMOTE}">`;
});

// R-14, the owner's "Yes, opt in per remote server" (2026-10-12): one bus for a page, which a
// remote server's runtime joins only where the page's project says so for that server.
describe("the page's one bus, and who joins it", () => {
  it("is shared by the page's runtime and a remote the page admits", () => {
    const own = pageBus(undefined);
    expect(pageBus(location.origin)).toBe(own);
    expect(pageBus(REMOTE)).toBe(own);
    const a = own.forAssembly(sender("a1")).events;
    const heard: unknown[] = [];
    pageBus(REMOTE)
      .forAssembly(sender("b1"))
      .events.on<{ sku: string }>("cart:add", (message) => heard.push(message.payload));
    a.send("cart:add", { sku: "x" });
    expect(heard).toEqual([{ sku: "x" }]);
  });

  it("gives a remote the page does not admit a bus of its own", () => {
    const own = pageBus(undefined);
    const theirs = pageBus(OTHER);
    expect(theirs).not.toBe(own);
    const heard: unknown[] = [];
    theirs.forAssembly(sender("c1")).events.on("cart:add", (message) => heard.push(message));
    own.forAssembly(sender("a1")).events.send("cart:add", { sku: "x" });
    expect(heard).toEqual([]);
  });

  it("reads admission from the page, whichever runtime runs first", () => {
    const first = pageBus(REMOTE);
    expect(pageBus(undefined)).toBe(first);
    expect(pageBus(OTHER)).not.toBe(first);
  });

  it("keeps the page's replay topics on the shared bus even when a remote made it", () => {
    pageBus(REMOTE);
    const own = pageBus(undefined, ["cart:add"]);
    own.forAssembly(sender("a1")).events.send("cart:add", { sku: "x" });
    expect(pageBus(REMOTE).forAssembly(sender("b1")).events.last("cart:add")?.payload).toEqual({
      sku: "x",
    });
  });

  it("admits no remote on a page that names none", () => {
    document.head.innerHTML = "";
    expect(pageBus(REMOTE)).not.toBe(pageBus(undefined));
  });
});
