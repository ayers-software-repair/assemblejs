// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { MarkupInput } from "@assemblejs/core";
import type { CompiledTemplate } from "../engine/compiled-template.js";
import { loadCompiler } from "../engine/load-compiler.js";
import type { TemplateEngine } from "../engine/template-engine.js";

// Each template compiles once, the first time it renders; every later placement reuses it.
const compiled = new Map<TemplateEngine, Map<string, CompiledTemplate>>();

/**
 * Renders a template's source to the markup the server sends, with the placement's `data` and
 * `children`: what a template writes from `data` is escaped, and `children`, which is
 * already HTML, is written as it is by the engine's raw form.
 *
 * It does not catch: a template that does not compile or fails to render throws, the composer
 * catches it, and the placement falls back. A template that fails to compile is not remembered,
 * so it fails the same way on every render.
 */
export async function renderTemplate(
  engine: TemplateEngine,
  source: string,
  input: MarkupInput,
): Promise<string> {
  const templates = compiled.get(engine) ?? new Map<string, CompiledTemplate>();
  compiled.set(engine, templates);
  let template = templates.get(source);
  if (template === undefined) {
    template = (await loadCompiler(engine))(source);
    templates.set(source, template);
  }
  return template(input);
}
