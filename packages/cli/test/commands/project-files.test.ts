// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MCP_REGISTRATIONS, agentFiles, projectFiles } from "@assemblejs/cli";

describe("the smallest project that runs", () => {
  const files = projectFiles("my-app");

  it("depends on the version of the command line that wrote it, never a number typed twice", () => {
    const own = (
      JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
        version: string;
      }
    ).version;
    const manifest = JSON.parse(files["package.json"] ?? "{}") as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(manifest.dependencies["@assemblejs/core"]).toBe(`^${own}`);
    expect(manifest.devDependencies).toEqual({
      "@assemblejs/cli": `^${own}`,
      "@assemblejs/mcp": `^${own}`,
    });
  });

  // An agent that opens the project is told what it is, and has its agent surface to ask:
  // installed with the command line, and registered where each client looks for it.
  it("is written for the agents that will work in it", () => {
    const forAgents = agentFiles("my-app").files;
    expect(Object.keys(forAgents)).toHaveLength(5);
    for (const [path, contents] of Object.entries(forAgents)) {
      expect(files[path], path).toBe(contents);
    }
    for (const registration of MCP_REGISTRATIONS) {
      expect(files["README.md"], registration.path).toContain(`\`${registration.path}\``);
    }
    expect(files["README.md"]).toContain("`npx assemblejs add agents`");
  });

  it("has a server file that does not grow when an assembly is added", () => {
    const server = files["src/server.ts"] ?? "";
    // No imports per assembly, no arrays to append to: the generated module is the registry.
    expect(server).toContain('from "../.assemblejs/project.js"');
    expect(server).not.toContain("src/assemblies/");
    expect(server.split("\n").filter((line) => line.startsWith("import"))).toHaveLength(2);
  });

  it("ships one page placing one assembly, and no framework the author did not ask for", () => {
    expect(Object.keys(files)).toContain("src/assemblies/hello/hello.html");
    expect(files["src/pages/home/home.html"]).toContain('<assembly name="hello"></assembly>');
    const manifest = JSON.parse(files["package.json"] ?? "{}") as {
      dependencies: Record<string, string>;
    };
    expect(Object.keys(manifest.dependencies)).toEqual(["@assemblejs/core"]);
  });

  it("ignores the generated module rather than committing it", () => {
    expect(files[".gitignore"]).toContain(".assemblejs/");
  });
});
