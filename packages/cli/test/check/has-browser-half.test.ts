// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { discoverAssemblies, hasBrowserHalf, realIo } from "@assemblejs/cli";

const halves = (files: Record<string, string>): Record<string, boolean> => {
  const root = mkdtempSync(join(tmpdir(), "browser-half-"));
  for (const [path, contents] of Object.entries(files)) {
    realIo.write(join(root, "src/assemblies", path), contents);
  }
  return Object.fromEntries(
    discoverAssemblies(root).assemblies.map((assembly) => [
      assembly.name,
      hasBrowserHalf(root, assembly),
    ]),
  );
};

describe("whether an assembly has a half that runs in the browser", () => {
  it("is whether a static view has a client file beside it", () => {
    expect(
      halves({
        "plain/plain.html": "<p>plain</p>",
        "wired/wired.html": "<p>wired</p>",
        "wired/wired.client.ts": "export default () => undefined;",
        "note/note.md": "A note.",
      }),
    ).toEqual({ plain: false, wired: true, note: false });
  });

  it("is every framework view but one that declares it mounts nothing", () => {
    expect(
      halves({
        "counter/counter.react.tsx": "export default () => null;",
        "banner/banner.react.tsx": 'export const mount = "none";\nexport default () => null;',
        "later/later.react.tsx": 'export const mount = "visible";\nexport default () => null;',
      }),
    ).toEqual({ counter: true, banner: false, later: true });
  });

  it("takes a mount the view computes as one that mounts, as the placement rules do", () => {
    expect(
      halves({
        "maybe/maybe.react.tsx":
          'const mode = process.env.MODE ?? "none";\nexport const mount = mode;\nexport default () => null;',
      }),
    ).toEqual({ maybe: true });
  });
});
