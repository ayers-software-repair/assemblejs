// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { generateClientEntry } from "@assemblejs/cli";
import type { DiscoveredAssembly } from "@assemblejs/cli";

const assembly = (name: string, renderer: string): DiscoveredAssembly => ({
  name,
  directory: `/p/src/assemblies/${name}`,
  view: `/p/src/assemblies/${name}/${name}.x`,
  renderer,
  client: undefined,
  service: undefined,
  styles: [],
});

describe("the page's one script", () => {
  it("loads each assembly's module by name, only when it mounts", () => {
    const source = generateClientEntry([
      assembly("counter", "svelte"),
      assembly("readout", "react"),
    ]);
    expect(source).toContain('"counter": () => import("./client/counter.js"),');
    expect(source).toContain('"readout": () => import("./client/readout.js"),');
    expect(source).toContain('import { lazyRenderer, start } from "@assemblejs/core/client";');
  });

  it("starts the runtime with that one browser half for every renderer present", () => {
    const source = generateClientEntry([
      assembly("counter", "svelte"),
      assembly("readout", "react"),
    ]);
    expect(source).toContain(
      'start({ renderers: { "react": renderer, "svelte": renderer }, origin: new URL(import.meta.url).origin });',
    );
  });
});
