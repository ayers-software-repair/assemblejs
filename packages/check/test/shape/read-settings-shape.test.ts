// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { realIo } from "@asmjs/build";
import { describe, expect, it } from "vitest";
import { COMPUTED, UNREAD, readSettingsShape } from "@asmjs/check";
import { linkedProject } from "../../../build/test/fixtures/linked-project.js";

const settings = async (source?: string) => {
  const root = mkdtempSync(join(tmpdir(), "settings-shape-"));
  if (source !== undefined) realIo.write(join(root, "assemblejs.config.ts"), source);
  return await readSettingsShape(root);
};

const NOTHING = {
  remotes: [],
  publicRoutes: [],
  contentSecurityPolicy: null,
  authenticate: false,
  budgets: {},
  limits: {},
  outline: false,
};

describe("what a project's config declares, read from its source", () => {
  it("is nothing declared, and no file, for a project with no config", async () => {
    expect(await settings()).toEqual(NOTHING);
  });

  it("is each field as written, and what its absence means for one not written", async () => {
    expect(
      await settings(
        'import { defineConfig } from "@asmjs/core";\nexport default defineConfig({ remotes: [{ origin: "https://shop.example", forward: ["cookie"] }], budgets: { document: 14000 } });',
      ),
    ).toEqual({
      ...NOTHING,
      file: "assemblejs.config.ts",
      remotes: [{ origin: "https://shop.example", forward: ["cookie"] }],
      budgets: { document: 14000 },
      limits: {},
    });
  });

  it("says whether every page carries its outline, as the config writes it", async () => {
    expect((await settings("export default { outline: true };")).outline).toBe(true);
    expect(
      (await settings('export default { outline: process.env.OUTLINE === "1" };')).outline,
    ).toBe(COMPUTED);
  });

  it("says that it declares an access check of its own, and never shows the check", async () => {
    const shape = await settings(
      'export default { authenticate: (request) => request.headers.cookie === "let-me-in", publicRoutes: ["/health"] };',
    );
    expect(shape).toMatchObject({ authenticate: true, publicRoutes: ["/health"] });
    expect(JSON.stringify(shape)).not.toContain("let-me-in");
  });

  it("shows only the fields it names, whatever else the config holds", async () => {
    const shape = await settings(
      'export default { budgets: { scripts: 9000 }, token: "hunter2" };',
    );
    expect(shape.budgets).toEqual({ scripts: 9000 });
    expect(JSON.stringify(shape)).not.toContain("hunter2");
  });

  it("marks a field the config computes, and every field a spread may bring in", async () => {
    expect(
      await settings(
        "export default { remotes: remotesFor(process.env), budgets: { document: kb(14) } };",
      ),
    ).toMatchObject({ remotes: COMPUTED, budgets: { document: COMPUTED }, publicRoutes: [] });
    expect(await settings('export default { ...shared, publicRoutes: ["/health"] };')).toEqual({
      file: "assemblejs.config.ts",
      remotes: COMPUTED,
      publicRoutes: ["/health"],
      contentSecurityPolicy: COMPUTED,
      authenticate: COMPUTED,
      budgets: COMPUTED,
      limits: COMPUTED,
      outline: COMPUTED,
    });
  });

  it("marks every field of a config computed whole, or that cannot be read", async () => {
    const all = (mark: string) => ({
      file: "assemblejs.config.ts",
      remotes: mark,
      publicRoutes: mark,
      contentSecurityPolicy: mark,
      authenticate: mark,
      budgets: mark,
      limits: mark,
      outline: mark,
    });
    expect(await settings("export default configFor(process.env);")).toEqual(all(COMPUTED));
    expect(await settings("export default { budgets: ")).toEqual(all(UNREAD));
  });

  it("marks every field of a config that leads out of the project, there or not, unopened", async () => {
    for (const target of ["outside:secret.config.ts", "outside:no-such-config.ts"]) {
      const { root } = linkedProject({}, { "assemblejs.config.ts": target });
      const shape = await readSettingsShape(root);
      expect(shape, target).toMatchObject({ file: "assemblejs.config.ts", budgets: UNREAD });
      expect(
        Object.values(shape).filter((value) => value === UNREAD),
        target,
      ).toHaveLength(7);
    }
  });
});
