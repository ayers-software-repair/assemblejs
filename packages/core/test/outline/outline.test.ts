// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OUTLINE_ATTRIBUTE, OUTLINE_ELEMENT, OUTLINE_ROUTE } from "@assemblejs/core";
import { outline } from "@assemblejs/core/outline";

const PAGE =
  '<main><assembly-root data-name="shell" data-id="a" data-view="default" data-renderer="html">' +
  '<header><assembly-root data-name="badge" data-id="b" data-view="default" data-renderer="html">' +
  "<b>badge</b></assembly-root></header></assembly-root></main>" +
  `<script type="application/json" ${OUTLINE_ATTRIBUTE}>${JSON.stringify({
    route: "/",
    ms: 4.2,
    placements: [
      {
        id: "a",
        name: "shell",
        view: "default",
        source: "local",
        ms: 3,
        children: [{ id: "b", name: "badge", view: "default", source: "cache", ms: 0.1 }],
      },
    ],
  })}</script>`;

/** Gives the first element inside each envelope a box, as a browser that lays out would. */
const layOut = (): void => {
  const rect = (top: number): DOMRect =>
    ({ left: 8, top, width: 300, height: 40, right: 308, bottom: top + 40 }) as DOMRect;
  for (const [at, held] of [...document.querySelectorAll("header, b")].entries()) {
    vi.spyOn(held, "getBoundingClientRect").mockReturnValue(rect(8 + at * 4));
  }
};
/** Lets the frames an outline draws in come round. */
const frames = () => new Promise((resolve) => setTimeout(resolve, 60));
const drawn = (): ShadowRoot => document.querySelector(OUTLINE_ELEMENT)?.shadowRoot as ShadowRoot;
const press = (): void => (drawn().querySelector(".switch") as HTMLButtonElement).click();

let remove: (() => void) | undefined;
beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = PAGE;
  layOut();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});
afterEach(() => {
  remove?.();
  vi.restoreAllMocks();
});

describe("drawing a page's outline", () => {
  it("adds one element after the body, with its stylesheet inside, and touches nothing else", async () => {
    const before = document.body.innerHTML;
    remove = outline(document);
    const host = document.querySelector(OUTLINE_ELEMENT) as HTMLElement;
    expect(host.parentElement).toBe(document.documentElement);
    expect(document.body.contains(host)).toBe(false);
    expect(drawn().querySelector("link")?.getAttribute("href")).toBe(OUTLINE_ROUTE.stylesheet);
    press();
    await frames();
    expect(document.body.innerHTML).toBe(before);
  });

  it("stays out of sight until its stylesheet has arrived", () => {
    // An address nothing can be asked at, so no sheet arrives until the test says one has.
    remove = outline(document, "http://[");
    const host = document.querySelector(OUTLINE_ELEMENT) as HTMLElement;
    expect(host.hidden).toBe(true);
    drawn().querySelector("link")?.dispatchEvent(new Event("load"));
    expect(host.hidden).toBe(false);
  });

  it("says so, and stays out of sight, where its stylesheet is refused", () => {
    remove = outline(document, "http://[");
    drawn().querySelector("link")?.dispatchEvent(new Event("error"));
    expect((document.querySelector(OUTLINE_ELEMENT) as HTMLElement).hidden).toBe(true);
    expect(console.warn).toHaveBeenCalledWith(
      "assemblejs: http://[ did not load, so the page's outline is not drawn",
    );
  });

  it("draws nothing until a visitor turns it on, and remembers that they did", async () => {
    remove = outline(document);
    await frames();
    expect(drawn().querySelector(".layer")?.hasAttribute("hidden")).toBe(true);
    expect(drawn().querySelectorAll(".frame")).toHaveLength(0);
    press();
    await frames();
    expect(drawn().querySelector(".layer")?.hasAttribute("hidden")).toBe(false);
    expect(drawn().querySelectorAll(".frame")).toHaveLength(2);
    remove();
    remove = outline(document);
    await frames();
    expect(drawn().querySelectorAll(".frame")).toHaveLength(2);
  });

  it("draws a box for each assembly that says what the server said of it", async () => {
    localStorage.setItem("assemblejs:outline", "on");
    remove = outline(document);
    await frames();
    const chips = [...drawn().querySelectorAll(".chip")].map((chip) => chip.textContent);
    expect(chips).toEqual(["shell 3 ms", "badge kept"]);
    expect(
      [...drawn().querySelectorAll(".frame")].map((frame) => (frame as HTMLElement).dataset.tone),
    ).toEqual(["local", "cache"]);
    expect(drawn().querySelector(".sum")?.textContent).toBe("/: 2 assemblies, composed in 4.2 ms");
    const [shell, badge] = [...drawn().querySelectorAll(".frame")] as HTMLElement[];
    expect(shell?.style.transform).toBe("translate(8px, 8px)");
    expect(badge?.style.transform).toBe("translate(8px, 12px)");
  });

  it("stands each chip on its box's top edge, clear of the others and inside the window", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(100);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(18);
    const wide = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(320);
    localStorage.setItem("assemblejs:outline", "on");
    remove = outline(document);
    await frames();
    const notes = (): string[] =>
      [...drawn().querySelectorAll(".note")].map((note) => (note as HTMLElement).style.transform);
    // Both boxes begin within a chip's height of the window's top, so the first chip stands
    // there and the second steps below it.
    expect(notes()).toEqual(["translate(8px, 0px)", "translate(8px, 18px)"]);
    wide.mockReturnValue(60);
    await frames();
    expect(notes()).toEqual(["translate(0px, 0px)", "translate(0px, 18px)"]);
  });

  it("takes the box of an assembly that left the page, and draws one that came", async () => {
    localStorage.setItem("assemblejs:outline", "on");
    remove = outline(document);
    await frames();
    document.querySelector('[data-name="badge"]')?.remove();
    const came = document.createElement("assembly-root");
    came.setAttribute("data-name", "later");
    document.querySelector("main")?.append(came);
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect([...drawn().querySelectorAll(".chip b")].map((name) => name.textContent)).toEqual([
      "shell",
      "later",
    ]);
  });

  it("is drawn once on a page however often it is started, and is taken away whole", () => {
    remove = outline(document);
    outline(document)();
    expect(document.querySelectorAll(OUTLINE_ELEMENT)).toHaveLength(1);
    remove();
    expect(document.querySelector(OUTLINE_ELEMENT)).toBeNull();
  });
});
