// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { TemplateCompiler } from "./template-compiler.js";

/**
 * Handlebars, which escapes what `{{ }}` writes, so every value from `data` is escaped; a child
 * is placed by the directive the template writes in its markup. Templates compile in an instance of this package's own, so a helper or partial
 * another library registers on the shared Handlebars never reaches them. A partial from another
 * file is refused when it renders; an inline partial, or a partial block's own fallback, is the
 * same file and renders. Handlebars compiles lazily, on the first render; the source is parsed
 * here instead and the parse handed to compile, so a template it cannot read throws when
 * compiled, as in every other engine, and is parsed once.
 */
export async function loadHandlebars(): Promise<TemplateCompiler> {
  const { default: handlebars } = await import("handlebars");
  const instance = handlebars.create();
  return (source) => {
    const render = instance.compile(instance.parse(source));
    return (input) => render({ data: input.data });
  };
}
