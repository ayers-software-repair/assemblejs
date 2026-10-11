// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { realIo, writeProjectStyles } from "@assemblejs/cli";

let root = "";
afterEach(() => rmSync(root, { recursive: true, force: true }));
const project = (files: Readonly<Record<string, string>> = {}): void => {
  root = mkdtempSync(join(tmpdir(), "project-styles-"));
  mkdirSync(join(root, "src"), { recursive: true });
  for (const [name, css] of Object.entries(files)) writeFileSync(join(root, "src", name), css);
};
const written = (url: string): string =>
  readFileSync(join(root, "dist", "client", "styles", url.split("/").at(-1) ?? ""), "utf8");

describe("writing the project's own stylesheets into the build", () => {
  it("writes the tokens and then the components, whole and unscoped, each named by its content", () => {
    project({
      "tokens.css": ":root { --ink: #17150f; }\n",
      "components.css": ".button { color: var(--ink); }\n",
    });
    const urls = writeProjectStyles(root, realIo);
    expect(urls).toHaveLength(2);
    expect(urls[0]).toMatch(/^\/_assemblejs\/assets\/styles\/tokens-[0-9a-f]{8}\.css$/);
    expect(urls[1]).toMatch(/^\/_assemblejs\/assets\/styles\/components-[0-9a-f]{8}\.css$/);
    expect(written(urls[0] ?? "")).toContain(":root { --ink: #17150f; }");
    expect(written(urls[1] ?? "")).toContain(".button { color: var(--ink); }");
    expect(written(urls[1] ?? "")).not.toContain("assembly-root");
    // The same content is the same url; a change is a new one.
    expect(writeProjectStyles(root, realIo)).toEqual(urls);
    writeFileSync(join(root, "src", "tokens.css"), ":root { --ink: #000; }\n");
    expect(writeProjectStyles(root, realIo)[0]).not.toBe(urls[0]);
  });

  it("links the one file a project has, and nothing for a project with neither", () => {
    project({ "components.css": "a { color: var(--accent); }\n" });
    expect(
      writeProjectStyles(root, realIo).map((url) => url.split("/").at(-1)?.split("-")[0]),
    ).toEqual(["components"]);
    project();
    expect(writeProjectStyles(root, realIo)).toEqual([]);
  });
});
