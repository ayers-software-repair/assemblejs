// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Renderer } from "@assemblejs/core/renderer";
import type { Component } from "solid-js";
import type { AssemblyProps } from "../props/assembly-props.js";
import { renderToMarkup } from "./render-to-markup.js";

/**
 * The server half of the Solid renderer.
 *
 * The infix is required and not a convenience: React, Preact and Solid all write .tsx, so a file
 * that does not say which is a file whose framework only the configuration knows.
 */
export const solidRenderer: Renderer = {
  name: "solid",
  extensions: [".solid.tsx", ".solid.jsx"],
  render: (input) =>
    renderToMarkup(input.template as Component<AssemblyProps>, {
      data: input.data,
    }),
};
