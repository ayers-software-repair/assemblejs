// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { run } from "@assemblejs/cli";
import type { Io } from "@assemblejs/cli";

const fake = (existing: readonly string[] = []) => {
  const written = new Map<string, string>();
  const logs: string[] = [];
  const errors: string[] = [];
  const io: Io = {
    write: (path, contents) => void written.set(path.replaceAll("\\", "/"), contents),
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
    for (const argv of [[], ["new"], ["add"], ["add", "assembly"], ["nonsense"]]) {
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

describe("new", () => {
  it("writes a project that runs", () => {
    const { io, written } = fake();
    expect(run(["new", "my-app"], io)).toBe(0);
    expect([...written.keys()].sort()).toEqual([
      "my-app/.gitignore",
      "my-app/README.md",
      "my-app/package.json",
      "my-app/src/assemblies/hello/hello.html",
      "my-app/src/server.ts",
    ]);
  });

  it("refuses a directory that already exists rather than writing into it", () => {
    const { io, written, errors } = fake(["my-app"]);
    expect(run(["new", "my-app"], io)).toBe(1);
    expect(written.size).toBe(0);
    expect(errors.join()).toContain("already exists");
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
    expect([...written.keys()].sort()).toEqual([
      "src/assemblies/cart/cart.css",
      "src/assemblies/cart/cart.svelte",
    ]);
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
