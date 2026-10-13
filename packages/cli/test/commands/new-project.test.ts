// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { realIo } from "@assemblejs/build";
import type { Io } from "@assemblejs/build";
import { afterEach, describe, expect, it, vi } from "vitest";
import { newProject } from "@assemblejs/cli";

/** An io that writes nowhere, and keeps what it was told. */
const fake = () => {
  const written = new Map<string, string>();
  const logs: string[] = [];
  const errors: string[] = [];
  const io: Io = {
    write: (path, contents) => void written.set(path.replaceAll("\\", "/"), String(contents)),
    exists: () => false,
    remove: () => undefined,
    log: (line) => logs.push(line),
    error: (line) => errors.push(line),
  };
  return { io, written, logs, errors };
};
/** The real io, with what it said kept in place of printed. */
const told = () => {
  const logs: string[] = [];
  const errors: string[] = [];
  const io: Io = { ...realIo, log: (line) => logs.push(line), error: (line) => errors.push(line) };
  return { io, logs, errors };
};
/** A directory that is there, named as a project may be, holding the files given. */
const directory = (files: Readonly<Record<string, string>> = {}, name = "my-shop"): string => {
  const root = join(mkdtempSync(join(tmpdir(), "new-project-")), name);
  mkdirSync(root);
  for (const [path, contents] of Object.entries(files)) writeFileSync(join(root, path), contents);
  return root;
};

describe("new", () => {
  afterEach(() => void vi.unstubAllEnvs());

  it("writes a project that runs", () => {
    vi.stubEnv("npm_config_user_agent", "npm/11.0.0 node/v24.0.0");
    const { io, written, logs } = fake();
    expect(newProject("my-app", ".", io)).toBe(0);
    expect([...written.keys()].sort()).toEqual([
      "my-app/.cursor/mcp.json",
      "my-app/.gemini/settings.json",
      "my-app/.gitignore",
      "my-app/.mcp.json",
      "my-app/.vscode/mcp.json",
      "my-app/AGENTS.md",
      "my-app/CLAUDE.md",
      "my-app/README.md",
      "my-app/opencode.json",
      "my-app/package.json",
      "my-app/src/assemblies/hello/hello.html",
      "my-app/src/components.css",
      "my-app/src/pages/home/home.html",
      "my-app/src/server.ts",
      "my-app/src/tokens.css",
      "my-app/tsconfig.json",
    ]);
    expect(logs.at(-1)).toBe("\n  cd my-app\n  npm install\n  npm run dev");
  });

  it("refuses a directory whose name cannot name a package, with one that can", () => {
    const { io, written, errors } = fake();
    expect(newProject("My App", ".", io)).toBe(2);
    expect(written.size).toBe(0);
    expect(errors.join()).toContain("try my-app");
  });

  it("needs a directory", () => {
    const { io, errors } = fake();
    expect(newProject(undefined, ".", io)).toBe(2);
    expect(newProject("", ".", io)).toBe(2);
    expect(errors.join()).toContain("needs a directory");
  });

  it("writes into an absolute directory where it says, not beneath where it ran", () => {
    const { io, written, logs } = fake();
    const target = join(tmpdir(), "target", "my-app");
    expect(newProject(target, join(tmpdir(), "ran-in"), io)).toBe(0);
    expect(written.has(`${target.replaceAll("\\", "/")}/package.json`)).toBe(true);
    expect([...written.keys()].some((path) => path.includes("ran-in"))).toBe(false);
    expect(logs.join("\n")).toContain(`cd ${target}`);
  });

  // `new .` was refused as a name: "." cannot name a package, try assembly.
  it("makes the project where the command works, for a directory of one dot, named for it", () => {
    const root = directory();
    const { io, logs } = told();
    expect(newProject(".", root, io)).toBe(0);
    expect(JSON.parse(readFileSync(join(root, "package.json"), "utf8"))).toMatchObject({
      name: "my-shop",
    });
    expect(logs).toContain("wrote package.json");
    // There is nowhere to change to: it is where the command already works.
    expect(logs.at(-1)).toMatch(/^\n {2}\S+ install\n {2}\S+ run dev$/);
    // The same directory by another spelling.
    const again = directory();
    expect(newProject("./", again, told().io)).toBe(0);
    expect(existsSync(join(again, "src", "server.ts"))).toBe(true);
  });

  it("says a name that works where the directory it works in cannot name a package", () => {
    const { io, errors } = told();
    expect(newProject(".", directory({}, "My Shop"), io)).toBe(2);
    expect(errors).toEqual([
      '"My Shop" cannot name a package; lower case with hyphens: try my-shop',
    ]);
    const nameless = told();
    expect(newProject(".", directory({}, "2026"), nameless.io)).toBe(2);
    expect(nameless.errors.join()).toContain("try my-app");
  });

  // A repository made a minute ago holds a README, what git passes over and a licence.
  it("makes the project in a directory that is there and holds nothing of a project", () => {
    const root = directory({
      "README.md": "# Ours\n",
      ".gitignore": "node_modules\r\n.env\r\n",
      LICENSE: "Ours.\n",
    });
    const { io, logs } = told();
    expect(newProject(basename(root), join(root, ".."), io)).toBe(0);
    expect(readFileSync(join(root, "README.md"), "utf8")).toBe("# Ours\n");
    expect(readFileSync(join(root, ".gitignore"), "utf8")).toBe(
      "node_modules\r\n.env\r\ndist/\r\n.assemblejs/\r\ndeploy/\r\n",
    );
    expect(readFileSync(join(root, "LICENSE"), "utf8")).toBe("Ours.\n");
    expect(logs).toContain(`wrote ${join("my-shop", ".gitignore")}`);
    expect(logs).not.toContain(`wrote ${join("my-shop", "README.md")}`);
    expect(existsSync(join(root, "src", "pages", "home", "home.html"))).toBe(true);
  });

  it("refuses a directory that holds what the starter would write over, and names it", () => {
    const root = directory({ "package.json": "{}" });
    const { io, errors } = told();
    expect(newProject(basename(root), join(root, ".."), io)).toBe(1);
    expect(errors).toEqual([
      "my-shop already holds package.json: a project is made where the starter writes over nothing",
    ]);
    expect(readFileSync(join(root, "package.json"), "utf8")).toBe("{}");
    expect(existsSync(join(root, "src"))).toBe(false);
    // Anything under src is the author's, whatever it is.
    const sourced = directory();
    mkdirSync(join(sourced, "src"));
    const again = told();
    expect(newProject(".", sourced, again.io)).toBe(1);
    expect(again.errors.join()).toContain(". already holds src/");
  });

  // A name a file held was made a directory of, and failed in the system's words and a stack.
  it("refuses a name that a file holds, or a link to nothing, in a line", () => {
    const parent = mkdtempSync(join(tmpdir(), "new-project-"));
    writeFileSync(join(parent, "notes"), "ours");
    symlinkSync(join(parent, "no-such-target"), join(parent, "dangling"));
    for (const name of ["notes", "dangling"]) {
      const { io, errors } = told();
      expect(newProject(name, parent, io)).toBe(1);
      expect(errors).toEqual([
        `${name} is there and is not a directory: name another, or move it aside`,
      ]);
    }
    expect(readFileSync(join(parent, "notes"), "utf8")).toBe("ours");
    expect(existsSync(join(parent, "no-such-target"))).toBe(false);
  });

  it("refuses a registration it cannot read, before it has written anything", () => {
    const root = directory({ ".mcp.json": "{ not json" });
    const { io, errors } = told();
    expect(newProject(".", root, io)).toBe(1);
    expect(errors).toEqual([
      ".mcp.json is not JSON, which a comment in it is enough to cause, and a server cannot be added to it without losing what it holds: correct it or remove it, then run this again",
    ]);
    expect(existsSync(join(root, "package.json"))).toBe(false);
  });

  it("writes nothing through a link that leads out of the directory, even one to nothing", () => {
    const outside = mkdtempSync(join(tmpdir(), "outside-"));
    const root = directory();
    symlinkSync(outside, join(root, ".vscode"));
    const { io, errors } = told();
    expect(newProject(".", root, io)).toBe(1);
    expect(errors.join()).toMatch(/leads out of the project/);
    expect(existsSync(join(outside, "mcp.json"))).toBe(false);
    expect(existsSync(join(root, "package.json"))).toBe(false);
    // A link to nothing where the starter writes holds its place.
    const linked = directory();
    symlinkSync(join(outside, "no-such.json"), join(linked, "package.json"));
    const again = told();
    expect(newProject(".", linked, again.io)).toBe(1);
    expect(again.errors.join()).toContain("already holds package.json");
    expect(existsSync(join(outside, "no-such.json"))).toBe(false);
  });
});
