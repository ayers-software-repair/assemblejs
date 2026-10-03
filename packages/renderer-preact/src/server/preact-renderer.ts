// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Renderer } from "@assemblejs/core/renderer";
import type { AssemblyProps } from "../props/assembly-props.js";
import { renderToMarkup } from "./render-to-markup.js";

/**
 * The server half of the Preact renderer.
 *
 * The infix is required and not a convenience: React, Preact and Solid all write .tsx, so a file
 * that does not say which is a file whose framework only the configuration knows.
 */
export const preactRenderer: Renderer = {
  name: "preact",
  extensions: [".preact.tsx", ".preact.jsx"],
  render: (input) =>
    renderToMarkup(input.template as (props: AssemblyProps) => unknown, {
      data: input.data,
      children: input.children,
    }),
};
