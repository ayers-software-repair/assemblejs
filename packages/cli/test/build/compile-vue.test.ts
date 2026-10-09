// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { compileVue, loadVueCompiler } from "@assemblejs/cli";
import type { VueCompiler } from "@assemblejs/cli";

const example = fileURLToPath(new URL("../../../../examples/frameworks/", import.meta.url));
let compiler: VueCompiler;
beforeAll(async () => {
  const loaded = await loadVueCompiler(example);
  if (loaded === undefined) throw new Error("the frameworks example has no Vue compiler");
  compiler = loaded;
});

const setup = `<script setup lang="ts">
import { ref } from "vue";
const count = ref<number>(0);
</script>
<template><button class="b" @click="count++">vue {{ count }}</button></template>
<style scoped>.b { color: red }</style>`;

describe("compiling a single-file component", () => {
  it("renders strings for the server and hydrates in the browser, under one scope id", () => {
    const server = compileVue(compiler, setup, { filename: "/p/x.vue", id: "abc", side: "server" });
    const client = compileVue(compiler, setup, { filename: "/p/x.vue", id: "abc", side: "client" });
    expect(server.code).toContain("__ssrInlineRender: true");
    expect(server.code).toContain("data-v-abc");
    expect(client.code).not.toContain("__ssrInlineRender");
    expect(client.code).toContain('_sfc_main.__scopeId = "data-v-abc";');
    expect(server.code).toMatch(/export default _sfc_main;$/);
    expect(server.loader).toBe("ts");
    expect(client.css).toContain(".b[data-v-abc]");
  });

  it("compiles a component with no <script setup> through its own render function", () => {
    const plain = `<script>export const mount = "visible"; export default { data: () => ({ n: 1 }) };</script><template><p>{{ n }}</p></template>`;
    const server = compileVue(compiler, plain, { filename: "/p/y.vue", id: "def", side: "server" });
    const client = compileVue(compiler, plain, { filename: "/p/y.vue", id: "def", side: "client" });
    expect(server.code).toContain("_sfc_main.ssrRender = ssrRender;");
    expect(client.code).toContain("_sfc_main.render = render;");
    expect(client.code).toContain('export const mount = "visible"');
    expect(client.loader).toBe("js");
    expect(client.css).toBe("");
  });

  it("throws with Vue's own message for a component it cannot compile", () => {
    expect(() =>
      compileVue(compiler, "<template><p>{{ </p></template>", {
        filename: "/p/z.vue",
        id: "x",
        side: "client",
      }),
    ).toThrow(/z\.vue/);
  });

  it("renders the variables v-bind() reads in its styles on the server, as the browser will", () => {
    const vars = `<script setup lang="ts">const tone = "red";</script><template><p class="a">x</p></template><style>.a { color: v-bind(tone); }</style>`;
    const server = compileVue(compiler, vars, { filename: "/p/v.vue", id: "abc", side: "server" });
    expect(server.code).toMatch(/":--[0-9a-z]+": \(tone\)/);
    // And a component with no <script setup>, whose template is compiled on its own.
    const plain = `<script>export default { data: () => ({ tone: "red" }) };</script><template><p class="a">x</p></template><style>.a { color: v-bind(tone); }</style>`;
    const rendered = compileVue(compiler, plain, {
      filename: "/p/w.vue",
      id: "def",
      side: "server",
    });
    expect(rendered.code).toMatch(/--[0-9a-z]+.*tone/);
  });

  it("refuses what it would otherwise build green and render wrong", () => {
    for (const [part, source] of [
      ["<style module>", "<template><p>a</p></template><style module>.a{}</style>"],
      ['<style lang="scss">', '<template><p>a</p></template><style lang="scss">$c: red;</style>'],
      ["<style src>", '<template><p>a</p></template><style src="./a.css"></style>'],
      ["<template src>", '<template src="./a.html"></template>'],
      ['<template lang="pug">', '<template lang="pug">p a</template>'],
      ["<script src>", '<script src="./a.ts"></script><template><p>a</p></template>'],
      [
        '<script lang="tsx">',
        '<script setup lang="tsx">const a = 1;</script><template><p>a</p></template>',
      ],
    ] as const) {
      expect(
        () => compileVue(compiler, source, { filename: "/p/u.vue", id: "u", side: "client" }),
        part,
      ).toThrow(part);
    }
  });
});
