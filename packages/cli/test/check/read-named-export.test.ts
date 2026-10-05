// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { readNamedExport } from "@assemblejs/cli";

describe("reading what a module exports under a name, without running it", () => {
  it("reads a declared export and a re-exported declaration, as literals", () => {
    expect(readNamedExport('export const mount = "none";', "mount")).toBe("none");
    expect(readNamedExport('const m = "idle";\nexport { m as mount };', "mount")).toBe("idle");
    expect(readNamedExport("export const shadow = true;", "shadow")).toBe(true);
  });

  it("reads a view with JSX when told so, and nothing it does not export or computes", () => {
    const view = `export const mount = "visible";\nexport default function View() { return <p>hi</p>; }`;
    expect(readNamedExport(view, "mount", "tsx")).toBe("visible");
    expect(readNamedExport(view, "shadow", "tsx")).toBeUndefined();
    expect(readNamedExport("export const mount = process.env.M;", "mount")).toBeUndefined();
    expect(readNamedExport('const mount = "none";', "mount")).toBeUndefined();
  });

  it("throws for a module that cannot be compiled", () => {
    expect(() => readNamedExport("export const", "mount")).toThrow();
  });
});
