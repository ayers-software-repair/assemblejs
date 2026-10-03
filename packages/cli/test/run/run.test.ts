// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { projectFiles, realIo, run } from "@assemblejs/cli";
import type { Io } from "@assemblejs/cli";

const fake = (existing: readonly string[] = []) => {
  const written = new Map<string, string>();
  const logs: string[] = [];
  const errors: string[] = [];
  const io: Io = {
    write: (path, contents) => void written.set(path.replaceAll("\\", "/"), String(contents)),
    exists: (path) => existing.includes(path.replaceAll("\\", "/")),
    log: (line) => logs.push(line),
    error: (line) => errors.push(line),
  };
  return { io, written, logs, errors };
};

describe("the command line", () => {
  // Non-interactive by construction: there is no prompt anywhere, so there is no behaviour that
  // differs between a terminal and a pipe, and nothing to hang in CI when a flag is forgotten.
  it("never asks a question, whatever it is given", () => {
    for (const argv of [[], ["new"], ["add"], ["add", "assembly"], ["nonsense"], ["generate"]]) {
      const { io, errors, logs } = fake();
      const code = run(argv, io);
      expect(typeof code).toBe("number");
      expect([...errors, ...logs].join()).not.toMatch(/\?\s*$/);
    }
  });

  it("prints usage and fails when given nothing", () => {
    const { io, logs } = fake();
    expect(run([], io)).toBe(2);
    expect(logs.join()).toContain("assemblejs <command>");
  });

  it("prints usage and succeeds when asked for help", () => {
    const { io } = fake();
    expect(run(["help"], io)).toBe(0);
  });
});

describe("the verbs that read a project", () => {
  it("dispatch check, perf and deploy, each named in the usage", async () => {
    const { io, logs } = fake();
    run(["help"], io);
    for (const verb of ["check", "perf", "deploy"]) expect(logs.join("\n")).toContain(`  ${verb} `);
    const root = mkdtempSync(join(tmpdir(), "verbs-"));
    for (const [path, contents] of Object.entries(projectFiles("verbs"))) {
      realIo.write(join(root, path), contents);
    }
    expect(await run(["check", "--cwd", root], { ...realIo, log: () => undefined })).toBe(0);
    expect(
      await run(["deploy", "--cwd", mkdtempSync(join(tmpdir(), "none-"))], {
        ...realIo,
        error: () => undefined,
      }),
    ).toBe(1);
    expect(
      await run(["perf", "--cwd", mkdtempSync(join(tmpdir(), "none-"))], {
        ...realIo,
        error: () => undefined,
        log: () => undefined,
      }),
    ).toBe(1);
  });
});

describe("new", () => {
  it("writes a project that runs", () => {
    const { io, written } = fake();
    expect(run(["new", "my-app"], io)).toBe(0);
    expect([...written.keys()].sort()).toEqual([
      "my-app/.gitignore",
      "my-app/README.md",
      "my-app/package.json",
      "my-app/src/assemblies/hello/hello.html",
      "my-app/src/pages/home/home.html",
      "my-app/src/server.ts",
    ]);
  });

  it("refuses a directory that already exists rather than writing into it", () => {
    const { io, written, errors } = fake(["my-app"]);
    expect(run(["new", "my-app"], io)).toBe(1);
    expect(written.size).toBe(0);
    expect(errors.join()).toContain("already exists");
  });

  it("refuses a directory whose name cannot name a package, with one that can", () => {
    const { io, written, errors } = fake();
    expect(run(["new", "My App"], io)).toBe(2);
    expect(written.size).toBe(0);
    expect(errors.join()).toContain("try my-app");
  });

  it("needs a directory", () => {
    const { io, errors } = fake();
    expect(run(["new"], io)).toBe(2);
    expect(errors.join()).toContain("needs a directory");
  });
});

describe("add assembly", () => {
  it("writes the assembly and nothing else", () => {
    const { io, written, logs } = fake();
    expect(run(["add", "assembly", "cart", "--renderer", "svelte"], io)).toBe(0);
    expect([...written.keys()].sort()).toEqual(["src/assemblies/cart/cart.svelte"]);
    // The one thing it does NOT touch is the author's own server file.
    expect([...written.keys()].some((path) => path.includes("server"))).toBe(false);
    expect(logs.join()).toContain(`<assembly name="cart">`);
  });

  it("defaults to a plain template, so no framework arrives unasked", () => {
    const { io, written } = fake();
    run(["add", "assembly", "cart"], io);
    expect([...written.keys()]).toContain("src/assemblies/cart/cart.html");
  });

  it("refuses a name that could never be an assembly", () => {
    for (const name of ["Cart", "1cart", "cart name", "../etc"]) {
      const { io, written } = fake();
      expect(run(["add", "assembly", name], io)).toBe(2);
      expect(written.size).toBe(0);
    }
  });

  it("refuses a renderer it cannot scaffold, and names the ones it can", () => {
    const { io, errors } = fake();
    expect(run(["add", "assembly", "cart", "--renderer", "angular"], io)).toBe(2);
    expect(errors.join()).toContain("html");
  });

  it("refuses to overwrite an assembly that exists", () => {
    const { io, written } = fake(["src/assemblies/cart"]);
    expect(run(["add", "assembly", "cart"], io)).toBe(1);
    expect(written.size).toBe(0);
  });
});

describe("ending dev from a terminal", () => {
  const example = fileURLToPath(new URL("../../../../examples/two-frameworks/", import.meta.url));
  const bin = fileURLToPath(new URL("../../dist/bin.js", import.meta.url));
  // Starts dev on a project whose server ignores SIGTERM, sends the signals, and answers how long
  // dev took to end after the last one and whether the server outlived it.
  const endDev = async (signals: readonly NodeJS.Signals[]) => {
    const root = mkdtempSync(join(example, ".dev-interrupt-"));
    let pid = 0;
    try {
      mkdirSync(join(root, "src"));
      writeFileSync(join(root, "package.json"), "{}");
      writeFileSync(
        join(root, "src", "server.ts"),
        'import { writeFileSync } from "node:fs";\nprocess.on("SIGTERM", () => {});\nwriteFileSync(new URL("../server.pid", import.meta.url), String(process.pid));\nsetInterval(() => {}, 1000);\n',
      );
      const dev = spawn(process.execPath, [bin, "dev", "--cwd", root], { stdio: "ignore" });
      const exited = new Promise<void>((resolve) => dev.once("exit", () => resolve()));
      const pidFile = join(root, "server.pid");
      for (let tries = 0; tries < 200 && !existsSync(pidFile); tries += 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      pid = Number(readFileSync(pidFile, "utf8"));
      let last = Date.now();
      for (const [at, signal] of signals.entries()) {
        if (at > 0) await new Promise((resolve) => setTimeout(resolve, 300));
        last = Date.now();
        dev.kill(signal);
      }
      await exited;
      const took = Date.now() - last;
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Killed is enough: a container's first process may never reap it, leaving a zombie.
      const status = `/proc/${String(pid)}/status`;
      const running = (): boolean => {
        if (existsSync(status)) return !/^State:\s+Z/m.test(readFileSync(status, "utf8"));
        try {
          process.kill(pid, 0);
          return true;
        } catch {
          return false;
        }
      };
      return { took, running: running() };
    } finally {
      // Whatever the outcome, a test never leaves a server behind.
      try {
        if (pid > 0) process.kill(pid, "SIGKILL");
      } catch {
        // Already gone.
      }
      rmSync(root, { recursive: true, force: true });
    }
  };

  it("ends at once on a second Ctrl-C, and takes a server that ignores the first with it", async () => {
    const { took, running } = await endDev(["SIGINT", "SIGINT"]);
    // At once: well inside the grace a first Ctrl-C gives the server.
    expect(took).toBeLessThan(1500);
    expect(running).toBe(false);
  }, 30000);

  it("ends when its terminal closes, and takes the server with it", async () => {
    const { running } = await endDev(["SIGHUP"]);
    expect(running).toBe(false);
  }, 30000);
});
