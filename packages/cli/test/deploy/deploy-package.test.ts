// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { deployPackage } from "@assemblejs/cli";

describe("the package a deploy carries", () => {
  it("keeps the name, version, engines and dependencies, and drops what a server does not need", () => {
    expect(
      deployPackage(
        {
          name: "shop",
          version: "2.1.0",
          engines: { node: ">=24" },
          scripts: { dev: "assemblejs dev", build: "assemblejs build" },
          dependencies: { "@assemblejs/core": "^1.0.0" },
          devDependencies: { "@assemblejs/cli": "^1.0.0" },
        },
        "/p",
        "/p/deploy",
      ),
    ).toEqual({
      name: "shop",
      version: "2.1.0",
      private: true,
      type: "module",
      engines: { node: ">=24" },
      scripts: { start: "node dist/server.js" },
      dependencies: { "@assemblejs/core": "^1.0.0" },
    });
  });

  it("points a local dependency from where the deploy is written", () => {
    const written = deployPackage(
      { dependencies: { lib: "file:../lib", tool: "link:vendor/tool", abs: "file:/opt/x" } },
      "/p/app",
      "/p/app/deploy",
    );
    expect(written["dependencies"]).toEqual({
      lib: "file:../../lib",
      tool: "link:../vendor/tool",
      abs: "file:/opt/x",
    });
  });

  it("fills what a project left out", () => {
    expect(deployPackage({}, "/p", "/p/deploy")).toMatchObject({
      name: "assemblejs-app",
      version: "0.0.0",
      engines: { node: ">=22" },
      dependencies: {},
    });
  });
});
