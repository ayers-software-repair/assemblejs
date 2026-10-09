// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { TEMPLATE_RENDERERS } from "./template-renderers.js";

/**
 * Whether a renderer's view is server markup and nothing more: plain html and the template
 * languages. Such a view has no browser half of its own; a `.client.ts` beside it gives it one.
 */
export function isStaticView(renderer: string): boolean {
  return renderer === "html" || TEMPLATE_RENDERERS.includes(renderer);
}
