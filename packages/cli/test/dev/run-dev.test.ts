// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { freePort, realIo, runDev } from "@assemblejs/cli";

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
    const port = String(await freePort());
    process.env["ASSEMBLEJS_PORT"] = port;
    const errors: string[] = [];
    const io = { ...realIo, log: () => undefined, error: (line: string) => errors.push(line) };
    const controller = new AbortController();
    const page = async () => (await fetch(`http://127.0.0.1:${port}/`)).text();
    const done = runDev(root, io, controller.signal);
    try {
      await until(async () => (await page()).includes("first"));
      // While the server runs, the record says where, for the agent surface to ask it.
      const record = join(root, ".assemblejs", "dev.json");
      await until(async () => existsSync(record));
      expect(JSON.parse(readFileSync(record, "utf8"))).toEqual({ url: `http://127.0.0.1:${port}` });
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
    expect(existsSync(join(root, ".assemblejs", "dev.json"))).toBe(false);
    // Every server here was stopped by dev itself, on a restart or at the end.
    expect(errors.join()).not.toContain("the server stopped");
  });
});

// Found 2026-10-11. A build begins by removing dist, and a build that fails after that had
// left "the last good build" running with no files: its stylesheets and scripts gone, and the
// record the agent surface reads removed with the generated directory.
describe("dev, while a later build runs or fails", () => {
  it("keeps the last good build whole: its page, its browser files and its record", async () => {
    const kept = mkdtempSync(join(example, ".dev-kept-"));
    try {
      const hello = join(kept, "src", "assemblies", "hello");
      mkdirSync(hello, { recursive: true });
      mkdirSync(join(kept, "src", "pages", "home"), { recursive: true });
      writeFileSync(join(kept, "package.json"), "{}");
      writeFileSync(join(hello, "hello.html"), "<p>good</p>");
      writeFileSync(join(hello, "hello.css"), "p { margin: 0; }");
      writeFileSync(
        join(kept, "src", "pages", "home", "home.html"),
        '<html><head></head><body><assembly name="hello"></assembly></body></html>',
      );
      writeFileSync(
        join(kept, "src", "server.ts"),
        'import { createServer } from "@assemblejs/core";\nimport project from "../.assemblejs/project.js";\nconst app = await createServer(project);\nconst { url } = await app.listen();\nconsole.log(`listening ${url}`);\n',
      );
      const port = String(await freePort());
      process.env["ASSEMBLEJS_PORT"] = port;
      const errors: string[] = [];
      const controller = new AbortController();
      const at = (path: string) => fetch(`http://127.0.0.1:${port}${path}`);
      const done = runDev(
        kept,
        { ...realIo, log: () => undefined, error: (line) => errors.push(line) },
        controller.signal,
      );
      try {
        await until(async () => (await (await at("/")).text()).includes("good"));
        const sheet = /href="([^"]+hello-[^"]+\.css)"/.exec(await (await at("/")).text())?.[1];
        // Not asked for yet: a file the server has not read is one it must still find.
        expect(sheet).toBeDefined();
        const record = join(kept, ".assemblejs", "dev.json");
        await until(async () => existsSync(record));
        // A view that does not parse: the bundler refuses it, after the build has begun and
        // before it has written one browser file.
        mkdirSync(join(kept, "src", "assemblies", "broken"));
        writeFileSync(join(kept, "src", "assemblies", "broken", "broken.svelte"), "<p>{</p>");
        await until(async () => errors.some((line) => line.includes("still running")));
        expect(await (await at("/")).text()).toContain("good");
        expect((await at(sheet ?? "")).status).toBe(200);
        expect(existsSync(record)).toBe(true);
      } finally {
        controller.abort();
        delete process.env["ASSEMBLEJS_PORT"];
      }
      expect(await done).toBe(0);
    } finally {
      rmSync(kept, { recursive: true, force: true });
    }
  });
});

// Found 2026-10-11. Every burst of changes queued a whole build of its own, and a build made
// while the sources moved was started all the same.
describe("dev, when changes arrive while it builds", () => {
  it("folds them into one build after it, and starts only a build of the sources as they are", async () => {
    const busy = mkdtempSync(join(example, ".dev-busy-"));
    mkdirSync(join(busy, "src"));
    const settled: boolean[] = [];
    let builds = 0;
    let slow = true;
    const controller = new AbortController();
    const done = runDev(
      busy,
      { ...realIo, log: () => undefined, error: () => undefined },
      controller.signal,
      async (_root, _io, settle) => {
        builds += 1;
        if (slow) await new Promise((resolve) => setTimeout(resolve, 900));
        // Whether dev takes this build: it does not start one the sources moved under.
        settled.push((await settle?.()) ?? false);
        return 1;
      },
    );
    try {
      await until(async () => builds === 1);
      // Five saves, each its own burst, all while the first build runs.
      for (let save = 0; save < 5; save += 1) {
        writeFileSync(join(busy, "src", `note-${String(save)}.txt`), "changed");
        await new Promise((resolve) => setTimeout(resolve, 130));
      }
      slow = false;
      await until(async () => settled.length === 2);
      await new Promise((resolve) => setTimeout(resolve, 400));
      expect(builds).toBe(2);
      expect(settled).toEqual([false, true]);
    } finally {
      controller.abort();
      await done;
      rmSync(busy, { recursive: true, force: true });
    }
  });
});

describe("dev, when the project misbehaves", () => {
  it("keeps rebuilding for a server that never says it is listening, and stops it at the end", async () => {
    const quiet = mkdtempSync(join(example, ".dev-quiet-"));
    try {
      mkdirSync(join(quiet, "src", "pages", "home"), { recursive: true });
      mkdirSync(join(quiet, "src", "assemblies", "hello"), { recursive: true });
      writeFileSync(join(quiet, "package.json"), "{}");
      const view = join(quiet, "src", "assemblies", "hello", "hello.html");
      writeFileSync(view, "<p>one</p>");
      writeFileSync(
        join(quiet, "src", "pages", "home", "home.html"),
        '<body><assembly name="hello"></assembly></body>',
      );
      // Listens, and says nothing at all.
      writeFileSync(
        join(quiet, "src", "server.ts"),
        'import { createServer } from "@assemblejs/core";\nimport project from "../.assemblejs/project.js";\nawait (await createServer(project)).listen();\n',
      );
      const port = String(await freePort());
      process.env["ASSEMBLEJS_PORT"] = port;
      const controller = new AbortController();
      const page = async () => (await fetch(`http://127.0.0.1:${port}/`)).text();
      const errors: string[] = [];
      const done = runDev(
        quiet,
        { ...realIo, log: () => undefined, error: (line) => errors.push(line) },
        controller.signal,
      );
      try {
        await until(async () => (await page()).includes("one"));
        writeFileSync(view, "<p>two</p>");
        await until(async () => (await page()).includes("two"));
      } finally {
        controller.abort();
        delete process.env["ASSEMBLEJS_PORT"];
      }
      expect(await done).toBe(0);
      await expect(page()).rejects.toThrow();
      // It never said it was listening, and was still never reported as stopping by itself.
      expect(errors.join()).not.toContain("the server stopped");
    } finally {
      rmSync(quiet, { recursive: true, force: true });
    }
  });

  it("survives a build step that throws, says so, and ends cleanly", async () => {
    const errors: string[] = [];
    const controller = new AbortController();
    const thrown = mkdtempSync(join(example, ".dev-throw-"));
    mkdirSync(join(thrown, "src"));
    const done = runDev(
      thrown,
      { ...realIo, log: () => undefined, error: (line) => errors.push(line) },
      controller.signal,
      async () => {
        throw new Error("ENOENT: a directory vanished");
      },
    );
    await until(async () => errors.some((line) => line.includes("could not run")));
    controller.abort();
    expect(await done).toBe(0);
    expect(errors.join()).toContain("a directory vanished");
    rmSync(thrown, { recursive: true, force: true });
  });

  it("rebuilds when the project's config changes, and not for other files beside it", async () => {
    const configured = mkdtempSync(join(example, ".dev-config-"));
    mkdirSync(join(configured, "src"));
    writeFileSync(join(configured, "assemblejs.config.ts"), "export default {};");
    let builds = 0;
    const controller = new AbortController();
    const done = runDev(
      configured,
      { ...realIo, log: () => undefined, error: () => undefined },
      controller.signal,
      async () => {
        builds += 1;
        return 1;
      },
    );
    try {
      await until(async () => builds === 1);
      await new Promise((resolve) => setTimeout(resolve, 100));
      writeFileSync(join(configured, "notes.txt"), "not the config");
      await new Promise((resolve) => setTimeout(resolve, 400));
      expect(builds).toBe(1);
      writeFileSync(join(configured, "assemblejs.config.ts"), "export default { remotes: [] };");
      await until(async () => builds === 2);
    } finally {
      controller.abort();
      await done;
      rmSync(configured, { recursive: true, force: true });
    }
  });

  it("refuses to run where there is no src/ to watch", async () => {
    const errors: string[] = [];
    const empty = mkdtempSync(join(example, ".dev-empty-"));
    const answer = await runDev(
      empty,
      { ...realIo, log: () => undefined, error: (line) => errors.push(line) },
      new AbortController().signal,
    );
    rmSync(empty, { recursive: true, force: true });
    expect(answer).toBe(1);
    expect(errors.join()).toMatch(/no src\//);
  });
});
