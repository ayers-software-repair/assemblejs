// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { TEMPLATE_RENDERERS } from "../discovery/template-renderers.js";
import type { RendererPackage } from "./renderer-package.js";

/**
 * The framework renderers a build can wire, by the name a view file declares. Plain html needs
 * none: its view is its own markup. The template languages share one package, which renders
 * each by its engine. A renderer missing from here is one this version cannot
 * build yet, which the build says rather than emitting something that will not render.
 */
export const RENDERER_PACKAGES: Readonly<Record<string, RendererPackage>> = {
  lit: {
    name: "lit",
    package: "@asmjs/renderer-lit",
    browserSetup: "@asmjs/renderer-lit/hydration-support",
  },
  preact: { name: "preact", package: "@asmjs/renderer-preact" },
  react: { name: "react", package: "@asmjs/renderer-react" },
  solid: { name: "solid", package: "@asmjs/renderer-solid" },
  svelte: { name: "svelte", package: "@asmjs/renderer-svelte", compiler: "svelte" },
  vue: { name: "vue", package: "@asmjs/renderer-vue", compiler: "vue" },
  ...Object.fromEntries(
    TEMPLATE_RENDERERS.map((name) => [
      name,
      { name, package: "@asmjs/renderer-templates", template: true } as const,
    ]),
  ),
};
