// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createRequire } from "node:module";
import { transformSync } from "@babel/core";

const require = createRequire(import.meta.url);

/**
 * Compiles a Solid component's JSX, with its types already stripped, for one side: string
 * building for the server, DOM creation for the browser, both hydratable, so the browser adopts
 * the markup the server sent. Solid's JSX is not a function call any runtime can stand behind,
 * which is why it is compiled by Solid's own preset and nothing else. A compile error throws,
 * with Babel's message and the file.
 */
export function compileSolid(
  source: string,
  options: { readonly filename: string; readonly side: "client" | "server" },
): string {
  const result = transformSync(source, {
    filename: options.filename,
    babelrc: false,
    configFile: false,
    sourceMaps: false,
    presets: [
      [
        require("babel-preset-solid") as object,
        { generate: options.side === "server" ? "ssr" : "dom", hydratable: true },
      ],
    ],
  });
  if (result?.code === undefined || result.code === null) {
    throw new Error(`${options.filename}: Solid's compiler produced nothing`);
  }
  return result.code;
}
