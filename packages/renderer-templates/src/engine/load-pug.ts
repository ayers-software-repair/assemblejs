// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { TemplateCompiler } from "./template-compiler.js";

/**
 * Pug, which escapes what `=` and `#{}` write and writes what `!=` and `!{}` write as it is, so
 * a value from `data` is written with the first and a child's HTML with the second.
 */
export async function loadPug(): Promise<TemplateCompiler> {
  const { default: pug } = await import("pug");
  return (source) => {
    const render = pug.compile(source);
    return (input) => render({ data: input.data, children: input.children });
  };
}
