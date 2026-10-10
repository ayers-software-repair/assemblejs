// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { MarkupInput } from "@assemblejs/core";
import type { CompiledTemplate } from "../engine/compiled-template.js";
import { loadCompiler } from "../engine/load-compiler.js";
import type { TemplateEngine } from "../engine/template-engine.js";

// Each template compiles once, the first time it renders; every later placement reuses it.
const compiled = new Map<TemplateEngine, Map<string, CompiledTemplate>>();

/**
 * Renders a template's source to the markup the server sends, with the placement's `data`,
 * which a template writes escaped. A child is placed by the directive the template writes; the
 * composer puts it there once the template has rendered.
 *
 * It does not catch: a template that does not compile or fails to render throws, the composer
 * catches it, and the placement falls back, the same way on every render. Given the view's file,
 * the error names it, which the engines' own messages do not.
 */
export async function renderTemplate(
  engine: TemplateEngine,
  source: string,
  input: MarkupInput,
  file?: string,
): Promise<string> {
  const templates = compiled.get(engine) ?? new Map<string, CompiledTemplate>();
  compiled.set(engine, templates);
  try {
    let template = templates.get(source);
    if (template === undefined) {
      template = (await loadCompiler(engine))(source);
      templates.set(source, template);
    }
    return template(input);
  } catch (error) {
    if (file === undefined) throw error;
    throw new Error(`${file}: ${error instanceof Error ? error.message : String(error)}`, {
      cause: error,
    });
  }
}
