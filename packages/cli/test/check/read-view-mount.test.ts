// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readViewMount } from "@assemblejs/cli";

const file = (name: string, contents: string): string => {
  const path = join(mkdtempSync(join(tmpdir(), "view-mount-")), name);
  writeFileSync(path, contents);
  return path;
};

describe("the mount mode a framework view declares for itself", () => {
  it("is the string it exports, in a tsx view or a Svelte module script", () => {
    expect(
      readViewMount(
        file("a.react.tsx", 'export const mount = "none";\nexport default () => <p />;'),
      ),
    ).toBe("none");
    expect(
      readViewMount(file("a.svelte", '<script module>export const mount = "visible";</script>')),
    ).toBe("visible");
  });

  it("is undefined where none is written, where it is computed, or where the file cannot be read", () => {
    expect(readViewMount(file("a.react.tsx", "export default () => <p />;"))).toBeUndefined();
    expect(readViewMount(file("a.react.tsx", "export const mount = modes[0];"))).toBeUndefined();
    expect(readViewMount(file("a.react.tsx", "export const mount = "))).toBeUndefined();
    expect(readViewMount(join(tmpdir(), "no-such-view.react.tsx"))).toBeUndefined();
  });
});
