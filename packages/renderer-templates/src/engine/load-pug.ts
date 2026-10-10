// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { TemplateCompiler } from "./template-compiler.js";

/**
 * Pug, which escapes what `=` and `#{}` write, so a value from `data` is written with them; a
 * child is placed by the directive, which Pug writes as the tag `assembly(name="cart")`.
 */
export async function loadPug(): Promise<TemplateCompiler> {
  const { default: pug } = await import("pug");
  return (source) => {
    const render = pug.compile(source);
    return (input) => render({ data: input.data });
  };
}
