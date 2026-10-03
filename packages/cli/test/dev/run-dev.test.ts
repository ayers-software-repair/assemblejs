// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { realIo, runDev } from "@assemblejs/cli";

const example = fileURLToPath(new URL("../../../../examples/two-frameworks/", import.meta.url));
const root = mkdtempSync(join(example, ".dev-run-"));
afterAll(() => rmSync(root, { recursive: true, force: true }));

const until = async (check: () => Promise<boolean>, ms = 20000): Promise<void> => {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (await check().catch(() => false)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("timed out waiting");
};

describe("dev", () => {
  it("builds, serves, rebuilds on a change, keeps the last good build on a broken one, and stops", async () => {
    mkdirSync(join(root, "src", "assemblies", "hello"), { recursive: true });
    mkdirSync(join(root, "src", "pages", "home"), { recursive: true });
    writeFileSync(join(root, "package.json"), "{}");
    const view = join(root, "src", "assemblies", "hello", "hello.html");
    writeFileSync(view, "<p>first</p>");
    writeFileSync(
      join(root, "src", "pages", "home", "home.html"),
      '<body><assembly name="hello"></assembly></body>',
    );
    writeFileSync(
      join(root, "src", "server.ts"),
      'import { createServer } from "@assemblejs/core";\nimport project from "../.assemblejs/project.js";\nconst app = await createServer(project);\nconst { url } = await app.listen();\nconsole.log(`listening ${url}`);\n',
    );
    const port = String(20000 + Math.floor(Math.random() * 20000));
    process.env["ASSEMBLEJS_PORT"] = port;
    const errors: string[] = [];
    const io = { ...realIo, log: () => undefined, error: (line: string) => errors.push(line) };
    const controller = new AbortController();
    const page = async () => (await fetch(`http://127.0.0.1:${port}/`)).text();
    const done = runDev(root, io, controller.signal);
    try {
      await until(async () => (await page()).includes("first"));
      writeFileSync(view, "<p>second</p>");
      await until(async () => (await page()).includes("second"));

      // A view the build refuses: the last good server keeps answering, and dev says why.
      writeFileSync(join(root, "src", "assemblies", "hello", "hello.angular.tsx"), "");
      await until(async () => errors.some((line) => line.includes("still running")));
      expect(await page()).toContain("second");
    } finally {
      controller.abort();
      delete process.env["ASSEMBLEJS_PORT"];
    }
    expect(await done).toBe(0);
    await expect(page()).rejects.toThrow();
  });
});
