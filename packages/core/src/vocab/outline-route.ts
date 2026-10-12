// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { FRAMEWORK_ROUTE_PREFIX } from "./framework-route-prefix.js";

/**
 * What a server that draws the outline serves for it, under the framework's own prefix and
 * outside the devtools, since a project may show its outline in production: the script a page
 * links, the module that script starts, and the stylesheet the outline is drawn with.
 */
export const OUTLINE_ROUTE = {
  /** The script every page links when the project shows its outline. */
  script: `${FRAMEWORK_ROUTE_PREFIX}/outline.js`,
  /** The module that draws it, which the script imports and starts. */
  module: `${FRAMEWORK_ROUTE_PREFIX}/outline/index.js`,
  /** The stylesheet it is drawn with, linked inside the outline's own root and nowhere else. */
  stylesheet: `${FRAMEWORK_ROUTE_PREFIX}/outline.css`,
} as const;
