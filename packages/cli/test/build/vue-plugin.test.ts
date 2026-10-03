// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { describe, expect, it } from "vitest";
import { loadVueCompiler, vuePlugin } from "@assemblejs/cli";

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
});
