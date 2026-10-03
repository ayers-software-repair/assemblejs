// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { TemplateCompiler } from "./template-compiler.js";

/**
 * Handlebars, which escapes what `{{ }}` writes. A child's HTML is handed over as a safe
 * string, so `{{children.name}}` writes it as it is while every value from `data` stays
 * escaped. Each template compiles in an instance of its own, so nothing one registers reaches
 * another.
 */
export async function loadHandlebars(): Promise<TemplateCompiler> {
  const { default: handlebars } = await import("handlebars");
  const instance = handlebars.create();
  return (source) => {
    const render = instance.compile(source);
    return (input) =>
      render({
        data: input.data,
        children: Object.fromEntries(
          Object.entries(input.children).map(([name, html]) => [
            name,
            new instance.SafeString(html),
          ]),
        ),
      });
  };
}
