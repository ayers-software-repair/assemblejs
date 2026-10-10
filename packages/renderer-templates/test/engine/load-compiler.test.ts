// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { afterEach, describe, expect, it, vi } from "vitest";

const ENGINES = ["ejs", "handlebars", "markdown-it", "nunjucks", "pug"] as const;

afterEach(() => {
  for (const engine of ENGINES) vi.doUnmock(engine);
  vi.resetModules();
});

/** Mocks every engine so that loading one is recorded, and imports the package afresh. */
const watched = async () => {
  vi.resetModules();
  const imported: string[] = [];
  for (const engine of ENGINES) {
    vi.doMock(engine, async (original) => {
      imported.push(engine);
      return await original();
    });
  }
  const loaded = await import("@assemblejs/renderer-templates");
  return { imported, loaded };
};

describe("loading a template engine", () => {
  it("imports no engine until a template in its language renders, then only that one", async () => {
    const { imported, loaded } = await watched();
    expect(imported).toEqual([]);
    await loaded.renderTemplate("pug", "p hi", { data: {} });
    expect(imported).toEqual(["pug"]);
  });

  it("loads each engine once", async () => {
    const { imported, loaded } = await watched();
    expect(loaded.loadCompiler("ejs")).toBe(loaded.loadCompiler("ejs"));
    await loaded.loadCompiler("ejs");
    await loaded.loadCompiler("ejs");
    expect(imported).toEqual(["ejs"]);
  });

  it("tries again after an engine failed to load", async () => {
    vi.resetModules();
    let attempts = 0;
    vi.doMock("nunjucks", async (original) => {
      attempts += 1;
      if (attempts === 1) throw new Error("not installed");
      return await original();
    });
    const { loadCompiler } = await import("@assemblejs/renderer-templates");
    await expect(loadCompiler("nunjucks")).rejects.toThrow();
    expect(typeof (await loadCompiler("nunjucks"))).toBe("function");
  });
});
