// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ownPin } from "@asmjs/cli";

const pinned = (
  JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
    devDependencies: Record<string, string>;
  }
).devDependencies;

describe("the version of a tool this package was proven with", () => {
  it("is the one its own development dependencies pin, never a number typed twice", () => {
    expect(ownPin(import.meta.url, "typescript")).toBe(pinned["typescript"]);
    expect(ownPin(import.meta.url, "@types/node")).toBe(pinned["@types/node"]);
    expect(ownPin(import.meta.url, "typescript")).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("refuses a tool this package does not develop with", () => {
    expect(() => ownPin(import.meta.url, "left-pad")).toThrow(
      /left-pad is not a development dependency of this package/,
    );
  });
});
