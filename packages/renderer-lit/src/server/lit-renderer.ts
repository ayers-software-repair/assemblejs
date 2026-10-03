// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Renderer } from "@assemblejs/core/renderer";
import type { LitView } from "../props/lit-view.js";
import { renderToMarkup } from "./render-to-markup.js";

/**
 * The server half of the Lit renderer. A Lit view is TypeScript or JavaScript like a client or
 * a service file, so its name says which framework it is: `cart.lit.ts`.
 */
export const litRenderer: Renderer = {
  name: "lit",
  extensions: [".lit.ts", ".lit.js"],
  render: (input) =>
    renderToMarkup(input.template as LitView, { data: input.data, children: input.children }),
};
