// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, expect, it } from "vitest";
import { litAssemblyInTree } from "@assemblejs/renderer-lit/client";
import { BUTTON_MARKUP } from "../fixtures/button-markup.js";
import { shellHolding } from "../fixtures/shell-markup.js";

// A view's envelope holding the shell fixture's markup, with a child where its directive stood.
const holding = (child: string): Element => {
  const element = document.createElement("assembly-root");
  element.innerHTML = shellHolding(child);
  document.body.append(element);
  return element;
};
const envelope = (name: string, markup: string): string =>
  `<assembly-root data-id="${name}" data-name="${name}">${markup}</assembly-root>`;

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("a Lit assembly standing in a Lit view's own tree", () => {
  it("is not found in a view that placed nothing, whose markers are all its own", () => {
    expect(litAssemblyInTree(holding(""))).toBeUndefined();
  });

  it("is found by the markers its markup carries, whether or not they bind anything", () => {
    const bound = holding(envelope("inner", BUTTON_MARKUP));
    expect(litAssemblyInTree(bound)?.getAttribute("data-name")).toBe("inner");
    const unbound = holding(envelope("plain", "<!--lit-part AAAA--><p>plain</p><!--/lit-part-->"));
    expect(litAssemblyInTree(unbound)?.getAttribute("data-name")).toBe("plain");
  });

  it("is the innermost assembly around the marker, not one written in another framework", () => {
    const element = holding(
      envelope("react-card", `<div><!-- -->${envelope("lit-badge", BUTTON_MARKUP)}</div>`),
    );
    expect(litAssemblyInTree(element)?.getAttribute("data-name")).toBe("lit-badge");
  });

  it("is not an assembly written in another framework, whatever comments it carries", () => {
    const others =
      envelope("react", "<p>react <!-- -->0</p>") + envelope("svelte", "<!--[--><p>x</p><!--]-->");
    expect(litAssemblyInTree(holding(others + envelope("solid", "<p><!--$-->0<!--/--></p>")))).toBe(
      undefined,
    );
  });

  // A shadow root hides what is inside it from the walk Lit makes, so it is no hazard there.
  it("is not found behind a shadow root, its own or the one its view hydrates in", () => {
    const element = holding(envelope("inner", ""));
    const inner = element.querySelector('[data-name="inner"]');
    if (inner === null) throw new Error("the child's envelope is not in the slot");
    inner.attachShadow({ mode: "open" }).innerHTML = BUTTON_MARKUP;
    expect(litAssemblyInTree(element)).toBeUndefined();

    const host = document.createElement("assembly-root");
    document.body.append(host);
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = shellHolding(envelope("inner", BUTTON_MARKUP));
    // The view's own shadow root is its tree: a Lit assembly placed in it is in the way.
    expect(litAssemblyInTree(root)?.getAttribute("data-name")).toBe("inner");
  });
});
