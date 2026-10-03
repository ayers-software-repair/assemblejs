// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { RendererPackage } from "./renderer-package.js";

/**
 * The framework renderers a build can wire, by the name a view file declares. Plain html needs
 * none: its view is its own markup. A renderer missing from here is one this version cannot
 * build yet, which the build says rather than emitting something that will not render.
 */
export const RENDERER_PACKAGES: Readonly<Record<string, RendererPackage>> = {
  lit: {
    name: "lit",
    package: "@assemblejs/renderer-lit",
    browserSetup: "@assemblejs/renderer-lit/hydration-support",
  },
  preact: { name: "preact", package: "@assemblejs/renderer-preact" },
  react: { name: "react", package: "@assemblejs/renderer-react" },
  solid: { name: "solid", package: "@assemblejs/renderer-solid" },
  svelte: { name: "svelte", package: "@assemblejs/renderer-svelte" },
  vue: { name: "vue", package: "@assemblejs/renderer-vue" },
};
