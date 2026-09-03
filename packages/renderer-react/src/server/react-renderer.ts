// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Renderer } from "@assemblejs/core/renderer";
import type { AssemblyProps } from "../props/assembly-props.js";
import { renderToMarkup } from "./render-to-markup.js";

/**
 * The server half of the React renderer.
 *
 * The infix is required and not a convenience: React, Preact and Solid all write .tsx, so a file
 * that does not say which is a file whose framework only the configuration knows. A directory
 * listing should tell you what a page is made of.
 */
export const reactRenderer: Renderer = {
  name: "react",
  extensions: [".react.tsx", ".react.jsx"],
  render: (input) =>
    renderToMarkup(input.template as (props: AssemblyProps) => unknown, {
      data: input.data,
      children: input.children,
    }),
};
