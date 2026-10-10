// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { OutsideRootError, readInside } from "@assemblejs/cli";
import { linkedProject } from "../fixtures/linked-project.js";

describe("a file of the project, as text", () => {
  const { root, outside } = linkedProject(
    { "src/shared/real.ts": 'export default { route: "/store" };' },
    {
      "src/out.ts": "outside:secret.page.ts",
      "src/in.ts": "shared/real.ts",
      "src/first.ts": "in.ts",
      "src/chain.ts": "out.ts",
    },
  );

  it("is read where it is, through a link that stays inside, and through a link to one", () => {
    for (const path of ["src/shared/real.ts", "src/in.ts", "src/first.ts"]) {
      expect(readInside(root, join(root, path)), path).toBe('export default { route: "/store" };');
    }
  });

  it("is refused, unopened, where it leads out: by a link, by a link to one, or as written", () => {
    for (const file of [
      join(root, "src/out.ts"),
      join(root, "src/chain.ts"),
      join(outside, "secret.page.ts"),
    ]) {
      expect(() => readInside(root, file), file).toThrow(OutsideRootError);
    }
  });

  it("says nothing of what stood outside in refusing it", () => {
    try {
      readInside(root, join(root, "src/out.ts"));
      expect.unreachable("a link out of the project was read");
    } catch (error) {
      expect(String(error)).not.toContain("SECRET");
    }
  });

  it("throws as any read does for a file that is not there", () => {
    expect(() => readInside(root, join(root, "src/nowhere.ts"))).toThrow(/ENOENT/);
  });

  it("takes a root and a file given from where it is asked, as any read takes them", () => {
    const beneath = mkdtempSync(join(process.cwd(), "node_modules", ".read-inside-"));
    try {
      mkdirSync(join(beneath, "src"));
      writeFileSync(join(beneath, "src", "real.ts"), "export default 1;");
      symlinkSync(join(outside, "secret.page.ts"), join(beneath, "src", "out.ts"));
      const given = relative(process.cwd(), beneath);
      expect(readInside(given, join(given, "src", "real.ts"))).toBe("export default 1;");
      expect(() => readInside(given, join(given, "src", "out.ts"))).toThrow(OutsideRootError);
    } finally {
      rmSync(beneath, { recursive: true, force: true });
    }
  });
});
