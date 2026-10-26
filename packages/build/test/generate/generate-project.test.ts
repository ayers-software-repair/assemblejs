// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { generateProject } from "@asmjs/build";

describe("generating the one module the server file imports", () => {
  it("carries everything found and the version of this build", () => {
    const source = generateProject({ version: "9f2c1a3b4c5d", client: false, config: false });
    expect(source).toContain("assemblies,\n  pages,\n  apis,");
    expect(source).toContain('version: "9f2c1a3b4c5d",');
    expect(source).not.toContain("assets:");
    expect(source).toContain("GENERATED");
  });

  it("finds its browser files from the built module's own url, never a working directory", () => {
    const source = generateProject({ version: "1", client: true, config: false });
    expect(source).toContain('assets: fileURLToPath(new URL("./client/", import.meta.url)),');
    expect(source).not.toContain("process.cwd");
  });

  it("names the stylesheets every page links first, when the build wrote any", () => {
    const styles = ["/_assemblejs/assets/styles/tokens-1a2b3c4d.css"];
    expect(generateProject({ version: "1", client: true, config: false, styles })).toContain(
      'styles: ["/_assemblejs/assets/styles/tokens-1a2b3c4d.css"],',
    );
    expect(
      generateProject({ version: "1", client: false, config: false, styles: [] }),
    ).not.toContain("styles");
  });

  it("carries the policy the project's config declares, when it has one", () => {
    const source = generateProject({ version: "1", client: false, config: true });
    expect(source).toContain('import config from "../assemblejs.config.js";');
    expect(source).toContain("...config,");
    expect(generateProject({ version: "1", client: false, config: false })).not.toContain("config");
  });

  it("carries the not-found page when the project has one, and names nothing when it has none", () => {
    const source = generateProject({ version: "1", client: false, config: false, notFound: true });
    expect(source).toContain('import { notFound, pages } from "./pages.js";');
    expect(source).toContain("pages,\n  notFound,\n  apis,");
    expect(generateProject({ version: "1", client: false, config: false })).not.toContain(
      "notFound",
    );
  });
});
