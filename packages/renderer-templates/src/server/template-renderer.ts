// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Renderer } from "@assemblejs/core/renderer";
import type { TemplateEngine } from "../engine/template-engine.js";
import { TEMPLATE_EXTENSIONS } from "../engine/template-extensions.js";
import { renderTemplate } from "./render-template.js";

/** The server half of the renderer for one template language, its template being its source. */
export function templateRenderer(engine: TemplateEngine): Renderer {
  return {
    name: engine,
    extensions: [TEMPLATE_EXTENSIONS[engine]],
    render: (input) => renderTemplate(engine, String(input.template), { data: input.data }),
  };
}
