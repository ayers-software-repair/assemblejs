// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { buildProject, realIo, startServer } from "@assemblejs/cli";
import type { RunningServer } from "@assemblejs/cli";

// Nested inside the example, so the project resolves the workspace's packages from its
// node_modules exactly as an installed project would.
const example = fileURLToPath(new URL("../../../../examples/two-frameworks/", import.meta.url));
const root = mkdtempSync(join(example, ".dev-start-"));
let server: RunningServer | undefined;
// Stopped here as well as in the test, so a test that times out waiting cannot orphan a server.
afterAll(async () => {
  await server?.stop();
  rmSync(root, { recursive: true, force: true });
});

describe("starting a built server", () => {
  it("says the url it listens on, passes its output through, and stops", async () => {
    mkdirSync(join(root, "src", "assemblies", "hello"), { recursive: true });
    writeFileSync(join(root, "package.json"), "{}");
    writeFileSync(join(root, "src", "assemblies", "hello", "hello.html"), "<p>hi</p>");
    writeFileSync(
      join(root, "src", "server.ts"),
      'import { createServer } from "@assemblejs/core";\nimport project from "../.assemblejs/project.js";\nconst app = await createServer(project);\nconst { url } = await app.listen();\nconsole.log(`listening ${url}`);\n',
    );
    const logs: string[] = [];
    const io = { ...realIo, log: (line: string) => logs.push(line), error: () => undefined };
    expect(await buildProject(root, io)).toBe(0);

    process.env["ASSEMBLEJS_PORT"] = String(20000 + Math.floor(Math.random() * 20000));
    server = startServer(root, io);
    try {
      const url = await server.ready;
      expect(url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
      expect(logs.some((line) => line.startsWith("listening"))).toBe(true);
      expect((await fetch(`${String(url)}/assembly/hello/`)).status).toBe(200);
    } finally {
      await server.stop();
      delete process.env["ASSEMBLEJS_PORT"];
    }
  });
});

describe("stopping a server that will not stop", () => {
  it("makes it, once the grace period is over", async () => {
    const stubborn = mkdtempSync(join(example, ".dev-stubborn-"));
    try {
      mkdirSync(join(stubborn, "dist"));
      writeFileSync(
        join(stubborn, "dist", "server.js"),
        'process.on("SIGTERM", () => {});\nconsole.log("listening http://127.0.0.1:1");\nsetInterval(() => {}, 1000);\n',
      );
      const running = startServer(stubborn, { ...realIo, log: () => undefined }, 200);
      await running.ready;
      const started = Date.now();
      await running.stop();
      expect(Date.now() - started).toBeLessThan(2000);
    } finally {
      rmSync(stubborn, { recursive: true, force: true });
    }
  });
});
