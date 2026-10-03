// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { generateProject } from "@assemblejs/cli";

describe("generating the one module the server file imports", () => {
  it("carries everything found and the version of this build", () => {
    const source = generateProject({ version: "9f2c1a3b4c5d", client: false });
    expect(source).toContain("assemblies,\n  pages,\n  apis,");
    expect(source).toContain('version: "9f2c1a3b4c5d",');
    expect(source).not.toContain("assets:");
    expect(source).toContain("GENERATED");
  });

  it("finds its browser files from the built module's own url, never a working directory", () => {
    const source = generateProject({ version: "1", client: true });
    expect(source).toContain('assets: fileURLToPath(new URL("./client/", import.meta.url)),');
    expect(source).not.toContain("process.cwd");
  });
});
