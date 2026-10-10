// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { leadsOut } from "@assemblejs/cli";
import { linkedProject } from "../fixtures/linked-project.js";

describe("whether a path leaves the project", () => {
  const { root, outside } = linkedProject(
    { "src/shared/real.ts": "export default {};" },
    {
      "src/out.ts": "outside:secret.page.ts",
      "src/outdir": "outside:pagedir",
      "src/in.ts": "shared/real.ts",
      "src/chain.ts": "out.ts",
      "src/gone.ts": "outside:no-such-file.ts",
    },
  );

  it("is false for what is inside, a link that stays inside and what is not there yet", () => {
    for (const path of ["src/shared/real.ts", "src/in.ts", "src/not-written-yet.ts", "."]) {
      expect(leadsOut(root, join(root, path)), path).toBe(false);
    }
  });

  it("is true for a link out, anything beneath one, a link to one and a link to nothing outside", () => {
    for (const path of [
      "src/out.ts",
      "src/outdir",
      "src/outdir/landing.html",
      "src/chain.ts",
      "src/gone.ts",
    ]) {
      expect(leadsOut(root, join(root, path)), path).toBe(true);
    }
  });

  it("is true for a path written outside the root, with no link in it", () => {
    expect(leadsOut(root, join(outside, "secret.page.ts"))).toBe(true);
    expect(leadsOut(root, join(root, "..", "elsewhere"))).toBe(true);
  });

  // A reader hands this the path it would have handed a read, so both are taken as a read takes
  // them, from where it is asked: a root that is not whole must not hide a link out of it.
  it("takes a root and a path given from where it is asked, as any read takes them", () => {
    const beneath = mkdtempSync(join(process.cwd(), "node_modules", ".leads-out-"));
    try {
      mkdirSync(join(beneath, "src"));
      writeFileSync(join(beneath, "src", "real.ts"), "");
      symlinkSync(join(outside, "secret.page.ts"), join(beneath, "src", "out.ts"));
      const given = relative(process.cwd(), beneath);
      expect(leadsOut(given, join(given, "src", "out.ts"))).toBe(true);
      expect(leadsOut(given, join(given, "src", "real.ts"))).toBe(false);
      expect(leadsOut(given, join(beneath, "src", "out.ts"))).toBe(true);
    } finally {
      rmSync(beneath, { recursive: true, force: true });
    }
  });
});
