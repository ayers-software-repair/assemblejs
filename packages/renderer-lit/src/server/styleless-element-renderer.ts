// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { LitElementRenderer } from "@lit-labs/ssr";
import type { RenderInfo } from "@lit-labs/ssr";

/**
 * Renders a Lit element's shadow root as Lit does, without the inline `<style>` Lit writes first
 * in it: the page's default policy refuses an inline style, and the browser half adopts the same
 * styles as constructed sheets when the element hydrates. The styles are left out where Lit
 * produces them, so neither what they contain nor how the root is declared changes the result.
 */
export class StylelessElementRenderer extends LitElementRenderer {
  override renderShadow(renderInfo: RenderInfo): ReturnType<LitElementRenderer["renderShadow"]> {
    const rendered = super.renderShadow(renderInfo);
    if (!Array.isArray(rendered) || rendered[0] !== "<style>") return rendered;
    return rendered.slice(rendered.indexOf("</style>") + 1);
  }
}
