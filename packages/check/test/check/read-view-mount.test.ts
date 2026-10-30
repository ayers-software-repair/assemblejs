// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { readViewMount } from "@asmjs/check";

const file = (name: string, contents: string): string => {
  const path = join(mkdtempSync(join(tmpdir(), "view-mount-")), name);
  writeFileSync(path, contents);
  return path;
};

const mount = async (name: string, contents: string): Promise<string | undefined> => {
  const path = file(name, contents);
  return await readViewMount(dirname(path), path);
};

describe("the mount mode a framework view declares for itself", () => {
  it("is the string it exports, in a tsx view or a Svelte module script", async () => {
    expect(
      await mount("a.react.tsx", 'export const mount = "none";\nexport default () => <p />;'),
    ).toBe("none");
    expect(await mount("a.svelte", '<script module>export const mount = "visible";</script>')).toBe(
      "visible",
    );
  });

  it("is undefined where none is written, where it is computed, or where the file cannot be read", async () => {
    expect(await mount("a.react.tsx", "export default () => <p />;")).toBeUndefined();
    expect(await mount("a.react.tsx", "export const mount = modes[0];")).toBeUndefined();
    expect(await mount("a.react.tsx", "export const mount = ")).toBeUndefined();
    expect(await readViewMount(tmpdir(), join(tmpdir(), "no-such-view.react.tsx"))).toBeUndefined();
  });

  it("is undefined for a view outside the root it is asked of", async () => {
    const path = file("a.react.tsx", 'export const mount = "none";');
    expect(await readViewMount(dirname(path), path)).toBe("none");
    expect(await readViewMount(join(dirname(path), "elsewhere"), path)).toBeUndefined();
  });
});
