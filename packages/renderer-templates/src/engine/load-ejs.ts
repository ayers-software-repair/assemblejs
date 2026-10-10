// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { TemplateCompiler } from "./template-compiler.js";

/**
 * EJS, which escapes what `<%= %>` writes, so a value from `data` is written with it. Templates
 * compile in strict mode with `data` as their only local; a child is placed by the directive
 * the template writes in its markup. A view is one file: an include
 * throws rather than reading another file from wherever the server happens to run.
 */
export async function loadEjs(): Promise<TemplateCompiler> {
  const { default: ejs } = await import("ejs");
  return (source) => {
    const render = ejs.compile(source, {
      strict: true,
      destructuredLocals: ["data"],
      includer: (path) => {
        throw new Error(`an EJS view is one file, and cannot include ${path}`);
      },
    });
    return (input) => render({ data: input.data });
  };
}
