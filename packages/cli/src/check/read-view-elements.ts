// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { PugCompiler } from "../build/pug-compiler.js";
import { TEMPLATE_RENDERERS } from "../discovery/template-renderers.js";
import { scriptElements } from "./script-elements.js";
import { svelteElements } from "./svelte-elements.js";
import { templateElements } from "./template-elements.js";
import type { ViewElement } from "./view-element.js";
import { vueElements } from "./vue-elements.js";

/**
 * The elements one file of a view writes, read without building or running it, each kind by
 * what it is: a plain html view or a template as markup, Pug with the project's own Pug; a Vue
 * component's template and a Svelte component's markup as text; a module by the JSX and the
 * Lit templates it writes. Undefined where the source cannot be read for its elements, which
 * leaves it to the render: a Pug view with no Pug, a module that does not compile, a file of no
 * kind the readers know.
 */
export function readViewElements(
  file: string,
  renderer: string,
  source: string,
  pug?: PugCompiler,
): readonly ViewElement[] | undefined {
  if (renderer === "html" || renderer === "markdown" || TEMPLATE_RENDERERS.includes(renderer)) {
    return templateElements(renderer, source, pug);
  }
  if (file.endsWith(".svelte")) return svelteElements(source);
  if (file.endsWith(".vue")) return vueElements(source);
  if (!/\.[jt]sx?$/.test(file)) return undefined;
  try {
    return scriptElements(source, file.endsWith("x") ? "tsx" : "ts");
  } catch {
    return undefined;
  }
}
