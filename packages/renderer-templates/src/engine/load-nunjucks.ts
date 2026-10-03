// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { TemplateCompiler } from "./template-compiler.js";

/**
 * Nunjucks with escaping on, so `{{ }}` escapes every value from `data`. A child's HTML is
 * handed over as a safe string, so `{{ children.name }}` writes it as it is. The environment
 * is given an empty list of loaders, because given none Nunjucks reads templates from `views/`
 * under the working directory: a template is its own file, and one that includes, extends or
 * imports another is refused when it renders.
 */
export async function loadNunjucks(): Promise<TemplateCompiler> {
  const { default: nunjucks } = await import("nunjucks");
  const environment = new nunjucks.Environment([], { autoescape: true });
  return (source) => {
    const template = new nunjucks.Template(source, environment, undefined, true);
    return (input) =>
      template.render({
        data: input.data,
        children: Object.fromEntries(
          Object.entries(input.children).map(([name, html]) => [
            name,
            new nunjucks.runtime.SafeString(html),
          ]),
        ),
      });
  };
}
