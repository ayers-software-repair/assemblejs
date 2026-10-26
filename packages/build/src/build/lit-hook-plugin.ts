// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFile } from "node:fs/promises";
import type { Plugin } from "esbuild";

// Lit's element base, the one module of Lit that reads the hydration hook as it loads.
const ELEMENT_BASE = /[\\/]lit-element[\\/](?:development[\\/])?lit-element\.js$/;
const READ = "litElementHydrateSupport?.(";
const HOOK = "@asmjs/renderer-lit/hydration-hook";

/**
 * Has Lit's element base set this bundle's hydration hook itself, as the first thing its own
 * code does, before it reads the hook. The hook is one value on the page, which every server's
 * bundle sets, and the base reads it once, as it loads: set in the same module, with nothing
 * between, the value read is this bundle's however its chunks are split and whichever bundle
 * set it last.
 *
 * The hook is resolved from the project, which depends on the Lit renderer, and the base's own
 * imports from where it lives. A version of Lit whose base no longer reads the hook that way is
 * refused, by file, rather than built without it.
 */
export function litHookPlugin(root: string): Plugin {
  return {
    name: "assemblejs-lit-hook",
    setup(build) {
      build.onLoad({ filter: ELEMENT_BASE }, async (args) => {
        const source = await readFile(args.path, "utf8");
        if (!source.includes(READ)) {
          throw new Error(
            `${args.path} is Lit's element base and no longer reads its hydration hook as \`${READ}\`, so the build cannot set each bundle's own hook before it; this version of Lit needs a renderer that knows it.`,
          );
        }
        const hook = await build.resolve(HOOK, { kind: "import-statement", resolveDir: root });
        if (hook.path === "") {
          throw new Error(
            `${HOOK} could not be resolved from ${root}: ${hook.errors.map((error) => error.text).join("; ")}`,
          );
        }
        return {
          contents: `import { hydrationHook } from ${JSON.stringify(hook.path)};\nglobalThis.litElementHydrateSupport = hydrationHook;\n${source}`,
          loader: "js",
        };
      });
    },
  };
}
