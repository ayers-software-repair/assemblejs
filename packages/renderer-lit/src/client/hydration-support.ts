// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import "@lit-labs/ssr-client/lit-element-hydrate-support.js";
import type { CSSResultOrNative } from "lit";

type Installer = (lit: { readonly LitElement: { readonly prototype: object } }) => void;

/**
 * Lit's support for hydrating elements a server rendered, installed before any Lit element is
 * defined, as it must be: this module is the browser half's first import, and nothing in the
 * browser half loads Lit's element base, so the first to load it is the view, after this.
 *
 * Lit's support reuses the shadow root the server sent without adopting the element's styles,
 * which arrived as an inline `<style>` the page's policy refuses. So an element that hydrates
 * adopts its styles into that root, as one Lit rendered in the browser would.
 */
const scope = globalThis as { litElementHydrateSupport?: Installer };
const install = scope.litElementHydrateSupport;
scope.litElementHydrateSupport = (lit) => {
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

/** Whether the support is installed, for the browser half to say it was imported first. */
export const HYDRATION_SUPPORT = true;
