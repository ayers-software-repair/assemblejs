// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { findPlacements } from "@assemblejs/core";
import type { PugCompiler } from "../build/pug-compiler.js";
import { TEMPLATE_RENDERERS } from "../discovery/template-renderers.js";
import { collectPlacements } from "./collect-placements.js";
import { scriptPlacements } from "./script-placements.js";
import { sveltePlacements } from "./svelte-placements.js";
import { templatePlacements } from "./template-placements.js";
import type { ViewPlacements } from "./view-placements.js";
import { vuePlacements } from "./vue-placements.js";

const UNREAD: ViewPlacements = { placements: undefined, unnamed: [] };

/**
 * What a view's source says it places, read without building or running it, each kind of view
 * by what it is: a plain html view as a page's template is read; a template in its language,
 * Pug with the project's own Pug; a Markdown view places nothing; a framework view by the slots
 * it writes.
 *
 * Throws for a plain html view or a template whose directive cannot be read, as its render
 * would. A view that cannot be read for its placements at all answers none known, and the
 * render reads it.
 */
export function readViewPlacements(
  file: string,
  renderer: string,
  source: string,
  pug?: PugCompiler,
): ViewPlacements {
  if (renderer === "html") {
    return collectPlacements(
      findPlacements(source).map(({ name, view }) => ({ name, view, shown: name })),
    );
  }
  if (renderer === "markdown") return { placements: [], unnamed: [] };
  if (TEMPLATE_RENDERERS.includes(renderer)) return templatePlacements(renderer, source, pug);
  if (file.endsWith(".svelte")) return sveltePlacements(source);
  if (file.endsWith(".vue")) return vuePlacements(source);
  if (!/\.[jt]sx?$/.test(file)) return UNREAD;
  try {
    return scriptPlacements(source, file.endsWith("x") ? "tsx" : "ts");
  } catch {
    return UNREAD;
  }
}
