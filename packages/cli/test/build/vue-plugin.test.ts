// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { describe, expect, it } from "vitest";
import { describeBuildFailure, loadVueCompiler, vuePlugin } from "@assemblejs/cli";

const example = fileURLToPath(new URL("../../../../examples/frameworks/", import.meta.url));

describe("compiling .vue files in a bundle", () => {
  it("gives a component the same scope id on both sides, and hands its styles over", async () => {
    const compiler = await loadVueCompiler(example);
    if (compiler === undefined) throw new Error("no Vue compiler");
    const root = mkdtempSync(join(example, ".dev-vue-"));
    mkdirSync(join(root, "a"));
    writeFileSync(
      join(root, "a", "a.vue"),
      '<template><p class="x">a</p></template><style scoped>.x { color: red }</style>',
    );
    const css: string[] = [];
    const bundle = async (side: "client" | "server") =>
      (
        await build({
          entryPoints: [join(root, "a", "a.vue")],
          bundle: true,
          write: false,
          format: "esm",
          external: ["vue", "vue/server-renderer"],
          plugins: [vuePlugin(compiler, root, side, (_file, text) => css.push(text))],
        })
      ).outputFiles[0]?.text ?? "";
    const [server, client] = await Promise.all([bundle("server"), bundle("client")]).finally(() =>
      rmSync(root, { recursive: true, force: true }),
    );
    const id = /data-v-([0-9a-f]{8})/.exec(client)?.[1];
    expect(id).toBeDefined();
    expect(server).toContain(`data-v-${String(id)}`);
    expect(css.join()).toContain(`.x[data-v-${String(id)}]`);
  });

  // As a Svelte view was: the bundler named the module that imported the component.
  it("reports a component Vue cannot parse at the component, on the line Vue names", async () => {
    const compiler = await loadVueCompiler(example);
    if (compiler === undefined) throw new Error("no Vue compiler");
    const root = mkdtempSync(join(tmpdir(), "vue-plugin-"));
    writeFileSync(join(root, "broken.vue"), "<template>\n  <p>{{ </p>\n</template>\n");
    writeFileSync(
      join(root, "entry.js"),
      'import view from "./broken.vue";\nexport default view;\n',
    );
    const failed: unknown = await build({
      entryPoints: [join(root, "entry.js")],
      absWorkingDir: root,
      bundle: true,
      write: false,
      format: "esm",
      logLevel: "silent",
      plugins: [vuePlugin(compiler, root, "client")],
    }).catch((error: unknown) => error);
    const said = describeBuildFailure(failed);
    expect(said).toHaveLength(1);
    expect(said[0]).toMatch(/^broken\.vue:2 /);
    expect(said[0]).not.toContain(root);
  });
});
