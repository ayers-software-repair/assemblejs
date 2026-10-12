// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { PugCompiler } from "@assemblejs/build";
import { markedTemplate } from "@assemblejs/build";
import { readElements } from "./read-elements.js";
import type { ViewElement } from "./view-element.js";

/**
 * The elements a plain html or template view writes, read without rendering it: what the
 * language would compute stands as the marker, and what is left is read for its tags and
 * attributes. Markdown is prose and writes no element of its own. Undefined where the source
 * cannot be read as markup at all, which leaves it to the render.
 */
export function templateElements(
  renderer: string,
  source: string,
  pug?: PugCompiler,
): readonly ViewElement[] | undefined {
  if (renderer === "markdown") return [];
  const markup = markedTemplate(renderer, source, pug);
  return markup === undefined ? undefined : readElements(markup);
}
