// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { projectFiles } from "@assemblejs/cli";

describe("the smallest project that runs", () => {
  const files = projectFiles("my-app");

  it("has a server file that does not grow when an assembly is added", () => {
    const server = files["src/server.ts"] ?? "";
    // No imports per assembly, no arrays to append to: the generated module is the registry.
    expect(server).toContain("assemblies");
    expect(server).not.toContain("src/assemblies/");
    expect(server.split("\n").filter((line) => line.startsWith("import"))).toHaveLength(2);
  });

  it("ships one assembly, and no framework the author did not ask for", () => {
    expect(Object.keys(files)).toContain("src/assemblies/hello/hello.html");
    const manifest = JSON.parse(files["package.json"] ?? "{}") as {
      dependencies: Record<string, string>;
    };
    expect(Object.keys(manifest.dependencies)).toEqual(["@assemblejs/core"]);
  });

  it("ignores the generated module rather than committing it", () => {
    expect(files[".gitignore"]).toContain(".assemblejs/");
  });
});
