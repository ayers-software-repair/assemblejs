// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Renderer } from "@assemblejs/core/renderer";
import type { Component } from "vue";
import { renderToMarkup } from "./render-to-markup.js";

/** The server half of the Vue renderer. `.vue` is Vue's alone, so it needs no infix. */
export const vueRenderer: Renderer = {
  name: "vue",
  extensions: [".vue"],
  render: (input) => renderToMarkup(input.template as Component, { data: input.data }),
};
