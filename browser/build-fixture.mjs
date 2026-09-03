// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Bundles a browser fixture the way a real build would, so what chromium runs is what ships
// rather than a hand-written approximation of it.
import { build } from "esbuild";
import { compile } from "svelte/compiler";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

export async function bundleFixture(entry) {
  const result = await build({
    entryPoints: [here(`./fixtures/${entry}`)],
    bundle: true,
    format: "esm",
    jsx: "automatic",
    write: false,
    platform: "browser",
    target: "es2022",
    // The real Svelte compiler, so what chromium runs is what a user's build would produce.
    plugins: [
      {
        name: "svelte",
        setup(builder) {
          builder.onLoad({ filter: /\.svelte$/ }, (args) => {
            const compiled = compile(readFileSync(args.path, "utf8"), {
              filename: args.path,
              generate: "client",
            });
            return { contents: compiled.js.code, loader: "js" };
          });
        },
      },
    ],
    alias: {
      "@assemblejs/core/client": here("../packages/core/src/client/index.ts"),
      "@assemblejs/renderer-react/client": here("../packages/renderer-react/src/client/index.ts"),
      "@assemblejs/renderer-react": here("../packages/renderer-react/src/index.ts"),
      "@assemblejs/renderer-svelte/client": here("../packages/renderer-svelte/src/client/index.ts"),
      "@assemblejs/renderer-svelte": here("../packages/renderer-svelte/src/index.ts"),
    },
  });
  return result.outputFiles[0].text;
}
