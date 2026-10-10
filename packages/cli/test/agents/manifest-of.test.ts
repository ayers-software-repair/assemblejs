// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { manifestOf } from "@assemblejs/cli";

describe("what a package.json says that a project's agent files rest on", () => {
  it("is its name and version, and every package it depends on, of any kind, with what it asks", () => {
    expect(
      manifestOf(
        JSON.stringify({
          name: "shop",
          version: "2.1.0",
          dependencies: { "@assemblejs/core": "^1.0.0" },
          devDependencies: { "@assemblejs/cli": "1.0.0-next.0" },
          optionalDependencies: { fsevents: "*" },
          peerDependencies: { react: "*" },
        }),
      ),
    ).toEqual({
      name: "shop",
      version: "2.1.0",
      dependencies: {
        "@assemblejs/core": "^1.0.0",
        "@assemblejs/cli": "1.0.0-next.0",
        fsevents: "*",
      },
    });
  });

  // A package named in a script or a description is not one the project installs.
  it("is read from the manifest's fields, never from its text", () => {
    const manifest = JSON.stringify({ scripts: { mcp: "npx @assemblejs/mcp" } });
    expect(manifestOf(manifest).dependencies).toEqual({});
  });

  it("is none of them, from a manifest that is missing, unreadable or no object", () => {
    const nothing = { name: undefined, version: undefined, dependencies: {} };
    for (const source of [undefined, "", "{ not json", "null", "[]", '"shop"']) {
      expect(manifestOf(source), String(source)).toEqual(nothing);
    }
    expect(manifestOf('{ "name": 7, "version": 1, "dependencies": "x" }')).toEqual(nothing);
  });
});
