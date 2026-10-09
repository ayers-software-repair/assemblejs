// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { viewScript } from "@assemblejs/cli";

describe("the part of a view that is a module", () => {
  it("is a ts or tsx file whole, with the loader its extension names", () => {
    expect(viewScript("a.react.tsx", "x")).toEqual({ code: "x", loader: "tsx" });
    expect(viewScript("a.lit.ts", "x")).toEqual({ code: "x", loader: "ts" });
  });

  it("is a Svelte component's module script, under either spelling, and not its instance script", () => {
    const svelte = `<script module>\n  export const mount = "none";\n</script>\n<script lang="ts">\n  let { data } = $props();\n</script>\n<p>{data.n}</p>`;
    expect(viewScript("a.svelte", svelte)?.code).toContain('mount = "none"');
    const older = `<script context="module">export const shadow = true;</script><script>let x;</script>`;
    expect(viewScript("a.svelte", older)?.code).toContain("shadow = true");
    expect(viewScript("a.svelte", "<script>let x;</script><p></p>")).toBeUndefined();
  });

  it("is a Vue component's plain script, never its setup script", () => {
    const vue = `<script setup lang="ts">\nconst n = 1;\n</script>\n<script>\nexport const mount = "idle";\n</script>\n<template><p>{{ n }}</p></template>`;
    expect(viewScript("a.vue", vue)?.code).toContain('mount = "idle"');
    expect(viewScript("a.vue", "<script setup>const n = 1;</script>")).toBeUndefined();
  });

  it("is nothing for a view that is not a module", () => {
    expect(viewScript("a.html", "<p></p>")).toBeUndefined();
    expect(viewScript("a.ejs", "<p></p>")).toBeUndefined();
  });
});
