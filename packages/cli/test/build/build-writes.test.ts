// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { BUILD_WRITES, DEV_RECORD, buildProject, realIo } from "@assemblejs/cli";

const example = fileURLToPath(new URL("../../../../examples/two-frameworks/", import.meta.url));
const root = mkdtempSync(join(example, ".dev-writes-"));
afterAll(() => rmSync(root, { recursive: true, force: true }));
const quiet = { ...realIo, log: () => undefined, error: () => undefined };

describe("what a build writes in the generated directory", () => {
  it("is the modules the server file imports, the browser entry and where a build is made", () => {
    expect(BUILD_WRITES).toContain("project.ts");
    expect(BUILD_WRITES).toContain("client");
    expect(BUILD_WRITES).toContain("building");
  });

  it("is never the record dev keeps of the server it runs", () => {
    expect(BUILD_WRITES.map((written) => `.assemblejs/${written}`)).not.toContain(DEV_RECORD);
  });

  // Found 2026-10-11. A build removed dist and the whole generated directory before it knew it
  // would succeed: a failed one left no build at all, and took dev's record with it.
  it("is all a build removes there, and a build that fails or is left unused leaves the last whole", async () => {
    const hello = join(root, "src", "assemblies", "hello");
    mkdirSync(hello, { recursive: true });
    mkdirSync(join(root, "src", "pages", "home"), { recursive: true });
    writeFileSync(join(root, "package.json"), "{}");
    writeFileSync(join(hello, "hello.html"), "<p>first</p>");
    writeFileSync(
      join(root, "src", "pages", "home", "home.html"),
      '<body><assembly name="hello"></assembly></body>',
    );
    writeFileSync(
      join(root, "src", "server.ts"),
      'import { createServer } from "@assemblejs/core";\nimport project from "../.assemblejs/project.js";\nawait (await createServer(project)).listen();\n',
    );
    const server = join(root, "dist", "server.js");
    expect(await buildProject(root, quiet)).toBe(0);
    expect(readFileSync(server, "utf8")).toContain("first");

    // Another command's file beside the build's own, and a directory of its own, outlive a build.
    writeFileSync(join(root, DEV_RECORD), '{"url":"http://127.0.0.1:1"}\n');
    mkdirSync(join(root, ".assemblejs", "kept"));
    writeFileSync(join(root, ".assemblejs", "kept", "note.txt"), "not the build's");
    writeFileSync(join(hello, "hello.html"), "<p>second</p>");
    expect(await buildProject(root, quiet)).toBe(0);
    expect(readFileSync(server, "utf8")).toContain("second");
    expect(existsSync(join(root, DEV_RECORD))).toBe(true);
    expect(readFileSync(join(root, ".assemblejs", "kept", "note.txt"), "utf8")).toBe(
      "not the build's",
    );

    // A build left unused by its caller changes nothing, and leaves nothing half-made.
    writeFileSync(join(hello, "hello.html"), "<p>third</p>");
    expect(await buildProject(root, quiet, async () => false)).toBe(0);
    expect(readFileSync(server, "utf8")).toContain("second");
    expect(existsSync(join(root, ".assemblejs", "building"))).toBe(false);

    // A build the bundler refuses, after it has begun: the last build stands as it was.
    mkdirSync(join(root, "src", "assemblies", "broken"));
    writeFileSync(join(root, "src", "assemblies", "broken", "broken.svelte"), "<p>{</p>");
    expect(await buildProject(root, quiet)).toBe(1);
    expect(readFileSync(server, "utf8")).toContain("second");
    expect(existsSync(join(root, ".assemblejs", "building"))).toBe(false);
    expect(existsSync(join(root, DEV_RECORD))).toBe(true);
  });
});
