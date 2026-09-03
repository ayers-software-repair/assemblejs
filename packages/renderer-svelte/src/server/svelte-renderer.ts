// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Renderer } from "@assemblejs/core/renderer";
import { renderToMarkup } from "./render-to-markup.js";

/**
 * The server half of the Svelte renderer.
 *
 * No infix here, unlike React: `.svelte` says which framework wrote the file on its own, and
 * adding one would be ceremony that answers a question nobody has.
 */
export const svelteRenderer: Renderer = {
  name: "svelte",
  extensions: [".svelte"],
  render: (input) =>
    renderToMarkup(input.template, {
      data: input.data,
      children: input.children,
    }),
};
