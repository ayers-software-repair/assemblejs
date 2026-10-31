// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { readNamedExport } from "@asmjs/check";

describe("reading what a module exports under a name, without running it", () => {
  it("reads a declared export and a re-exported declaration, as literals", async () => {
    expect(await readNamedExport('export const mount = "none";', "mount")).toBe("none");
    expect(await readNamedExport('const m = "idle";\nexport { m as mount };', "mount")).toBe(
      "idle",
    );
    expect(await readNamedExport("export const shadow = true;", "shadow")).toBe(true);
  });

  it("reads a view with JSX when told so, and nothing it does not export or computes", async () => {
    const view = `export const mount = "visible";\nexport default function View() { return <p>hi</p>; }`;
    expect(await readNamedExport(view, "mount", "tsx")).toBe("visible");
    expect(await readNamedExport(view, "shadow", "tsx")).toBeUndefined();
    expect(await readNamedExport("export const mount = process.env.M;", "mount")).toBeUndefined();
    expect(await readNamedExport('const mount = "none";', "mount")).toBeUndefined();
  });

  it("throws for a module that cannot be compiled", async () => {
    await expect(readNamedExport("export const", "mount")).rejects.toThrow();
  });
});
