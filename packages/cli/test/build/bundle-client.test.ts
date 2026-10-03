// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { bundleClient, discoverAssemblies, loadSvelteCompiler, realIo } from "@assemblejs/cli";

const example = fileURLToPath(new URL("../../../../examples/two-frameworks/", import.meta.url));

describe("bundling the browser halves", () => {
  it("writes one module per assembly and answers the url of the one entry a page links", async () => {
    const { assemblies } = discoverAssemblies(join(example, "src", "assemblies"));
    const browser = assemblies.filter((assembly) => assembly.renderer !== "html");
    const quiet = { ...realIo, log: () => undefined };
    const url = await bundleClient(example, browser, await loadSvelteCompiler(example), quiet);
    expect(url).toMatch(/^\/_assemblejs\/assets\/client-[A-Z0-9]+\.js$/);
    const entry = join(example, "dist", "client", url.slice("/_assemblejs/assets/".length));
    expect(existsSync(entry)).toBe(true);
    // Each assembly is its own chunk, reached by a dynamic import rather than bundled in.
    expect(readFileSync(entry, "utf8")).toMatch(/import\(/);
    expect(existsSync(join(example, ".assemblejs", "client", "counter.ts"))).toBe(true);
  });
});
