// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Bundles a browser fixture the way a real build would, so what chromium runs is what ships
// rather than a hand-written approximation of it.
import { build } from "esbuild";
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
    alias: {
      "@assemblejs/core/client": here("../packages/core/src/client/index.ts"),
      "@assemblejs/renderer-react/client": here("../packages/renderer-react/src/client/index.ts"),
      "@assemblejs/renderer-react": here("../packages/renderer-react/src/index.ts"),
    },
  });
  return result.outputFiles[0].text;
}
