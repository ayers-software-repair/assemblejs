// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { realIo } from "@asmjs/build";
import type { Io } from "@asmjs/build";
import { describe, expect, it } from "vitest";
import { projectFiles, run } from "@asmjs/cli";

const fake = (existing: readonly string[] = []) => {
  const written = new Map<string, string>();
  const logs: string[] = [];
  const errors: string[] = [];
  const io: Io = {
    write: (path, contents) => void written.set(path.replaceAll("\\", "/"), String(contents)),
    exists: (path) => existing.includes(path.replaceAll("\\", "/")),
    remove: () => undefined,
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

  it("prints usage and fails when given nothing, and succeeds when asked for help", () => {
    const { io, logs } = fake();
    expect(run([], io)).toBe(2);
    expect(logs.join()).toContain("assemblejs <command>");
    expect(run(["help"], fake().io)).toBe(0);
  });
});

describe("the verbs the command has", () => {
  // The repository's README listed six after there were seven.
  it("are each named where the repository's README says what the command does", () => {
    const { io, logs } = fake();
    run(["help"], io);
    const verbs = new Set(
      logs
        .join("\n")
        .split("\n")
        .flatMap((line) => /^ {2}([a-z]+) /.exec(line)?.[1] ?? []),
    );
    expect([...verbs]).toEqual(["new", "add", "dev", "build", "check", "perf", "deploy"]);
    const readme = readFileSync(new URL("../../../../README.md", import.meta.url), "utf8");
    const said = /^- Command: .*$/m.exec(readme)?.[0] ?? "";
    for (const verb of verbs) expect(said, verb).toContain(`\`${verb}\``);
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
  // The agent instructions and registrations among them are held current by check from then on.
  it("writes a project its own check passes", async () => {
    const parent = mkdtempSync(join(tmpdir(), "new-"));
    expect(run(["new", "my-app", "--cwd", parent], { ...realIo, log: () => undefined })).toBe(0);
    const lines: string[] = [];
    const io = { ...realIo, log: (line: string) => void lines.push(line) };
    expect(await run(["check", "--cwd", join(parent, "my-app")], io)).toBe(0);
    expect(lines).toEqual(["no problems"]);
  });

  it("needs a directory", () => {
    const { io, errors } = fake();
    expect(run(["new"], io)).toBe(2);
    expect(errors.join()).toContain("needs a directory");
  });
});

describe("the command line's own flags", () => {
  it("says its version and stops, and refuses what it cannot read with the usage", () => {
    const manifest = fileURLToPath(new URL("../../package.json", import.meta.url));
    const own = JSON.parse(readFileSync(manifest, "utf8")) as { version: string };
    for (const argv of [["--version"], ["-v"], ["--version", "build"]]) {
      const { io, logs, written } = fake();
      expect(run(argv, io)).toBe(0);
      expect(logs).toEqual([own.version]);
      expect(written.size).toBe(0);
    }
    const { io, written, errors } = fake();
    expect(run(["add", "assembly", "cart", "--render", "react"], io)).toBe(2);
    expect(written.size).toBe(0);
    expect(errors[0]).toMatch(/no flag --render/);
    expect(errors.join("\n")).toContain("--version");
  });
});

describe("add agents", () => {
  it("is a thing add writes, named in the usage beside an assembly", () => {
    const { io, logs, errors } = fake();
    run(["help"], io);
    expect(logs.join("\n")).toContain("  add agents ");
    expect(run(["add", "nonsense"], io)).toBe(2);
    expect(errors.join()).toContain("assemblejs add assembly <name>, or assemblejs add agents");
  });

  it("writes into the project it is pointed at, and check then finds nothing to bring up to date", async () => {
    const root = mkdtempSync(join(tmpdir(), "add-agents-"));
    writeFileSync(join(root, "package.json"), '{ "devDependencies": { "@asmjs/mcp": "*" } }');
    mkdirSync(join(root, "src", "assemblies", "hello"), { recursive: true });
    writeFileSync(join(root, "src", "assemblies", "hello", "hello.html"), "<p>hello</p>");
    writeFileSync(join(root, "src", "server.ts"), "");
    const quiet = { ...realIo, log: () => undefined };
    expect(run(["add", "agents", "--cwd", root], quiet)).toBe(0);
    expect(readFileSync(join(root, "CLAUDE.md"), "utf8")).toBe("@AGENTS.md\n");
    expect(await run(["check", "--cwd", root], quiet)).toBe(0);
    writeFileSync(join(root, "CLAUDE.md"), "Ours alone.\n");
    const errors: string[] = [];
    expect(
      await run(["check", "--cwd", root], { ...quiet, error: (line) => errors.push(line) }),
    ).toBe(1);
    expect(errors.join("\n")).toContain("agent-instructions-are-current");
    expect(run(["add", "agents", "--cwd", root], quiet)).toBe(0);
    expect(readFileSync(join(root, "CLAUDE.md"), "utf8")).toBe("@AGENTS.md\n\nOurs alone.\n");
    expect(await run(["check", "--cwd", root], quiet)).toBe(0);
  });
});

describe("add assembly", () => {
  it("writes the assembly and nothing else", () => {
    const { io, written, logs } = fake(["package.json"]);
    expect(run(["add", "assembly", "cart", "--renderer", "svelte"], io)).toBe(0);
    expect([...written.keys()].sort()).toEqual(["src/assemblies/cart/cart.svelte"]);
    // The one thing it does NOT touch is the author's own server file.
    expect([...written.keys()].some((path) => path.includes("server"))).toBe(false);
    expect(logs.join()).toContain(`<assembly name="cart">`);
  });

  it("defaults to a plain template, so no framework arrives unasked", () => {
    const { io, written } = fake(["package.json"]);
    run(["add", "assembly", "cart"], io);
    expect([...written.keys()]).toContain("src/assemblies/cart/cart.html");
  });

  it('needs a name, and says so in those words, where it said "" is not a usable one', () => {
    const { io, written, errors } = fake();
    expect(run(["add", "assembly"], io)).toBe(2);
    expect(written.size).toBe(0);
    expect(errors.join()).toContain("add assembly needs a name");
  });

  it("refuses a name that could never be an assembly", () => {
    for (const name of ["Cart", "1cart", "cart name", "../etc"]) {
      const { io, written } = fake(["package.json"]);
      expect(run(["add", "assembly", name], io)).toBe(2);
      expect(written.size).toBe(0);
    }
  });

  it("refuses a renderer it cannot scaffold, and names the ones it can", () => {
    const { io, errors } = fake(["package.json"]);
    expect(run(["add", "assembly", "cart", "--renderer", "angular"], io)).toBe(2);
    expect(errors.join()).toContain("html");
  });

  it("refuses to overwrite an assembly that exists", () => {
    const { io, written } = fake(["package.json", "src/assemblies/cart"]);
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
      // Until the file holds a pid: between its creation and its write it exists and is empty,
      // and a pid read as 0 would name the whole process group, which a signal probe always finds.
      const pidFile = join(root, "server.pid");
      const pidIn = (): number =>
        existsSync(pidFile) ? Number.parseInt(readFileSync(pidFile, "utf8"), 10) : 0;
      for (let tries = 0; tries < 200 && !(pidIn() > 0); tries += 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      pid = pidIn();
      expect(pid).toBeGreaterThan(0);
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

  // Nothing in dev hears this one, so nothing in dev could stop the server: it was left
  // listening on its port for as long as the machine stayed up.
  it("takes the server with it when it is killed outright, which no handler hears", async () => {
    const { running } = await endDev(["SIGKILL"]);
    expect(running).toBe(false);
  }, 30000);
});
