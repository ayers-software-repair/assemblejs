// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { bundleClient, discoverAssemblies, loadCompilers, realIo } from "@assemblejs/cli";

const example = fileURLToPath(new URL("../../../../examples/two-frameworks/", import.meta.url));
// The example's source in a directory of this file's own, nested in the example so it resolves
// the workspace's packages as the example does: what is generated here is nobody else's to
// remove, and the example's own build is nobody's to bundle over.
const root = mkdtempSync(join(example, ".dev-bundle-"));
cpSync(join(example, "src"), join(root, "src"), { recursive: true });
writeFileSync(join(root, "package.json"), "{}");
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("bundling the browser halves", () => {
  it("writes one module per assembly and answers the url of the one entry a page links", async () => {
    const { assemblies } = discoverAssemblies(root);
    const browser = assemblies.filter((assembly) => assembly.renderer !== "html");
    const quiet = { ...realIo, log: () => undefined };
    const { compilers } = await loadCompilers(root, browser);
    const url = await bundleClient(root, browser, compilers, quiet);
    expect(url).toMatch(/^\/_assemblejs\/assets\/client-[A-Z0-9]+\.js$/);
    const entry = join(root, "dist", "client", url.slice("/_assemblejs/assets/".length));
    expect(existsSync(entry)).toBe(true);
    // Each assembly is its own chunk, reached by a dynamic import rather than bundled in.
    expect(readFileSync(entry, "utf8")).toMatch(/import\(/);
    expect(existsSync(join(root, ".assemblejs", "client", "counter.ts"))).toBe(true);
  });
});
