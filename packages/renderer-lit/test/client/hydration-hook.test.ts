// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from "vitest";

// A stand-in for Lit's element base, with what Lit's own support reads and patches on it.
class Reactive {
  static get observedAttributes(): string[] {
    return [];
  }
  update(): void {}
}

describe("the hook Lit's element base reads as it loads", () => {
  it("is set on the page as its module loads, in place of what was there", async () => {
    vi.resetModules();
    const { hydrationHook } = await import("../../src/client/hydration-hook.js");
    expect((globalThis as { litElementHydrateSupport?: unknown }).litElementHydrateSupport).toBe(
      hydrationHook,
    );
  });

  it("applies Lit's own support, then adopts an element's styles into the server's root", async () => {
    vi.resetModules();
    const { hydrationHook } = await import("../../src/client/hydration-hook.js");
    const sheet = new CSSStyleSheet();
    class Stub extends Reactive {
      static elementStyles = [sheet];
      createRenderRoot(): unknown {
        return "created";
      }
      connectedCallback(): void {}
      attributeChangedCallback(): void {}
    }
    hydrationHook({ LitElement: Stub });
    // Lit's own support: an element waits while it carries `defer-hydration`.
    expect((Stub as { observedAttributes?: string[] }).observedAttributes).toContain(
      "defer-hydration",
    );
    // An element the server rendered: its root is the server's, with its styles adopted.
    const rendered = new Stub();
    const root = { adoptedStyleSheets: [] as CSSStyleSheet[] };
    Object.defineProperty(rendered, "shadowRoot", { value: root });
    expect(rendered.createRenderRoot()).toBe(root);
    expect(root.adoptedStyleSheets).toEqual([sheet]);
    // One the browser renders has the root its base creates.
    const fresh = new Stub();
    Object.defineProperty(fresh, "shadowRoot", { value: null });
    expect(fresh.createRenderRoot()).toBe("created");
  });
});
