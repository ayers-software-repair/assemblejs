// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COMPUTED, UNREAD, readSettingsShape, realIo } from "@assemblejs/cli";
import { linkedProject } from "../fixtures/linked-project.js";

const settings = (source?: string) => {
  const root = mkdtempSync(join(tmpdir(), "settings-shape-"));
  if (source !== undefined) realIo.write(join(root, "assemblejs.config.ts"), source);
  return readSettingsShape(root);
};

const NOTHING = {
  remotes: [],
  publicRoutes: [],
  contentSecurityPolicy: null,
  authenticate: false,
  budgets: {},
};

describe("what a project's config declares, read from its source", () => {
  it("is nothing declared, and no file, for a project with no config", () => {
    expect(settings()).toEqual(NOTHING);
  });

  it("is each field as written, and what its absence means for one not written", () => {
    expect(
      settings(
        'import { defineConfig } from "@assemblejs/core";\nexport default defineConfig({ remotes: [{ origin: "https://shop.example", forward: ["cookie"] }], budgets: { document: 14000 } });',
      ),
    ).toEqual({
      ...NOTHING,
      file: "assemblejs.config.ts",
      remotes: [{ origin: "https://shop.example", forward: ["cookie"] }],
      budgets: { document: 14000 },
    });
  });

  it("says that it declares an access check of its own, and never shows the check", () => {
    const shape = settings(
      'export default { authenticate: (request) => request.headers.cookie === "let-me-in", publicRoutes: ["/health"] };',
    );
    expect(shape).toMatchObject({ authenticate: true, publicRoutes: ["/health"] });
    expect(JSON.stringify(shape)).not.toContain("let-me-in");
  });

  it("shows only the fields it names, whatever else the config holds", () => {
    const shape = settings('export default { budgets: { scripts: 9000 }, token: "hunter2" };');
    expect(shape.budgets).toEqual({ scripts: 9000 });
    expect(JSON.stringify(shape)).not.toContain("hunter2");
  });

  it("marks a field the config computes, and every field a spread may bring in", () => {
    expect(
      settings(
        "export default { remotes: remotesFor(process.env), budgets: { document: kb(14) } };",
      ),
    ).toMatchObject({ remotes: COMPUTED, budgets: { document: COMPUTED }, publicRoutes: [] });
    expect(settings('export default { ...shared, publicRoutes: ["/health"] };')).toEqual({
      file: "assemblejs.config.ts",
      remotes: COMPUTED,
      publicRoutes: ["/health"],
      contentSecurityPolicy: COMPUTED,
      authenticate: COMPUTED,
      budgets: COMPUTED,
    });
  });

  it("marks every field of a config computed whole, or that cannot be read", () => {
    const all = (mark: string) => ({
      file: "assemblejs.config.ts",
      remotes: mark,
      publicRoutes: mark,
      contentSecurityPolicy: mark,
      authenticate: mark,
      budgets: mark,
    });
    expect(settings("export default configFor(process.env);")).toEqual(all(COMPUTED));
    expect(settings("export default { budgets: ")).toEqual(all(UNREAD));
  });

  it("marks every field of a config that leads out of the project, there or not, unopened", () => {
    for (const target of ["outside:secret.config.ts", "outside:no-such-config.ts"]) {
      const { root } = linkedProject({}, { "assemblejs.config.ts": target });
      const shape = readSettingsShape(root);
      expect(shape, target).toMatchObject({ file: "assemblejs.config.ts", budgets: UNREAD });
      expect(
        Object.values(shape).filter((value) => value === UNREAD),
        target,
      ).toHaveLength(5);
    }
  });
});
