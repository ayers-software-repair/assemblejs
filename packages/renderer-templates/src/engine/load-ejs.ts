// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { TemplateCompiler } from "./template-compiler.js";

/**
 * EJS, which escapes what `<%= %>` writes and writes what `<%- %>` writes as it is, so a value
 * from `data` is written with the first and a child's HTML with the second. Templates compile in
 * strict mode with `data` and `children` as their only locals. A view is one file: an include
 * throws rather than reading another file from wherever the server happens to run.
 */
export async function loadEjs(): Promise<TemplateCompiler> {
  const { default: ejs } = await import("ejs");
  return (source) => {
    const render = ejs.compile(source, {
      strict: true,
      destructuredLocals: ["data", "children"],
      includer: (path) => {
        throw new Error(`an EJS view is one file, and cannot include ${path}`);
      },
    });
    return (input) => render({ data: input.data, children: input.children });
  };
}
