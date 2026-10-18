// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
/** @module @assemblejs/renderer-lit/hydration-hook */
import "@lit-labs/ssr-client/lit-element-hydrate-support.js";
import type { CSSResultOrNative } from "lit";

const scope = globalThis as { litElementHydrateSupport?: typeof hydrationHook };
// Lit's own, which its support module set as it loaded, bound to this bundle's copy of Lit.
const install = scope.litElementHydrateSupport;

/**
 * The hook Lit's element base calls once, as it loads, to adapt itself for hydrating elements a
 * server rendered: Lit's own support, and then the adoption of each element's styles.
 *
 * Lit's support reuses the shadow root the server sent without adopting the element's styles,
 * which arrived as an inline `<style>` the page's policy refuses. So an element that hydrates
 * adopts its styles into that root, as one Lit rendered in the browser would.
 *
 * Loading this module sets the hook on the page, in place of whatever was there.
 */
export const hydrationHook = (lit: {
  readonly LitElement: { readonly prototype: object };
}): void => {
  install?.(lit);
  const prototype = lit.LitElement.prototype as {
    createRenderRoot(this: HTMLElement): Element | ShadowRoot;
  };
  const create = prototype.createRenderRoot;
  prototype.createRenderRoot = function createRenderRoot(this: HTMLElement) {
    const styles = (this.constructor as { elementStyles?: CSSResultOrNative[] }).elementStyles;
    // Constructed sheets, which the page's policy allows where an inline <style> is refused.
    if (this.shadowRoot !== null && styles !== undefined) {
      this.shadowRoot.adoptedStyleSheets = styles.flatMap((style) => {
        const sheet = style instanceof CSSStyleSheet ? style : style.styleSheet;
        return sheet === undefined ? [] : [sheet];
      });
    }
    return create.call(this);
  };
};
scope.litElementHydrateSupport = hydrationHook;
