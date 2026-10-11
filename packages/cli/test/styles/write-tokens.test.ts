// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { realIo, writeTokens } from "@assemblejs/cli";

let root = "";
afterEach(() => rmSync(root, { recursive: true, force: true }));
const project = (tokens?: string): void => {
  root = mkdtempSync(join(tmpdir(), "tokens-"));
  mkdirSync(join(root, "src"), { recursive: true });
  if (tokens !== undefined) writeFileSync(join(root, "src", "tokens.css"), tokens);
};

describe("writing the project's tokens into the build", () => {
  it("writes the sheet whole and unscoped, named by its content, and answers its url", () => {
    project(":root { --ink: #17150f; }\nbody { color: var(--ink); }\n");
    const url = writeTokens(root, realIo);
    expect(url).toMatch(/^\/_assemblejs\/assets\/styles\/tokens-[0-9a-f]{8}\.css$/);
    const written = readFileSync(
      join(root, "dist", "client", "styles", url?.split("/").at(-1) ?? ""),
      "utf8",
    );
    expect(written).toContain(":root { --ink: #17150f; }");
    expect(written).not.toContain("assembly-root");
    // The same content is the same url; a changed token is a new one.
    expect(writeTokens(root, realIo)).toBe(url);
    writeFileSync(join(root, "src", "tokens.css"), ":root { --ink: #000; }\n");
    expect(writeTokens(root, realIo)).not.toBe(url);
  });

  it("writes nothing and answers nothing for a project without the file", () => {
    project();
    expect(writeTokens(root, realIo)).toBeUndefined();
  });
});
