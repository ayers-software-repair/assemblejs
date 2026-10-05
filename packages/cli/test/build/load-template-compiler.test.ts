// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadTemplateCompiler } from "@assemblejs/cli";

// The example that installs the templates package, as a project that did; the loader only walks
// upward from the root it is given, so the example's own root serves and nothing is written.
const templates = fileURLToPath(new URL("../../../../examples/templates/", import.meta.url));

describe("the project's own template engines", () => {
  it("loads the project's renderer-templates, whose compiler reads a template in each language", async () => {
    const load = await loadTemplateCompiler(templates);
    expect(load).toBeDefined();
    if (load === undefined) throw new Error("not loaded");
    expect((await load("ejs"))("<p><%= data.n %></p>")({ data: { n: 1 }, children: {} })).toBe(
      "<p>1</p>",
    );
    const pug = await load("pug");
    expect(() => pug("p\n  - if (\n")).toThrow();
  });

  it("is undefined where the project has none installed, which the build reports on its own", async () => {
    expect(await loadTemplateCompiler(mkdtempSync(join(tmpdir(), "no-engines-")))).toBeUndefined();
  });
});
