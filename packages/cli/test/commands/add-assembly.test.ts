// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { realIo } from "@assemblejs/build";
import type { Io } from "@assemblejs/build";
import { describe, expect, it } from "vitest";
import { addAssembly } from "@assemblejs/cli";

const project = (): string => {
  const root = mkdtempSync(join(tmpdir(), "add-"));
  writeFileSync(join(root, "package.json"), "{}");
  return root;
};
/** A project that has installed one renderer, as far as a build looks to find it. */
const installed = (): string => {
  const root = project();
  const at = join(root, "node_modules", "@assemblejs", "renderer-react");
  mkdirSync(at, { recursive: true });
  writeFileSync(join(at, "package.json"), "{}");
  return root;
};
const quiet = (): { io: Io; said: string[]; errors: string[] } => {
  const said: string[] = [];
  const errors: string[] = [];
  return {
    said,
    errors,
    io: { ...realIo, log: (line) => void said.push(line), error: (line) => void errors.push(line) },
  };
};

describe("adding an assembly from the command line", () => {
  it("writes the assembly into the project and says the tag that places it", () => {
    const root = project();
    const { io, said } = quiet();
    expect(addAssembly("cart", "html", root, io)).toBe(0);
    expect(readdirSync(join(root, "src", "assemblies", "cart"))).toEqual(["cart.html"]);
    expect(said.join("\n")).toContain('<assembly name="cart"></assembly>');
  });

  it("refuses an assembly that is there, and writes nothing over it", () => {
    const root = project();
    mkdirSync(join(root, "src", "assemblies", "cart"), { recursive: true });
    const { io, errors } = quiet();
    expect(addAssembly("cart", "html", root, io)).toBe(1);
    expect(readdirSync(join(root, "src", "assemblies", "cart"))).toEqual([]);
    expect(errors.join()).toContain("already exists");
  });

  // A mistyped --cwd made the directory, wrote the assembly into it and said it had.
  it("writes nothing where there is no project, and says where it looked", () => {
    const nowhere = join(mkdtempSync(join(tmpdir(), "add-")), "no-such-project");
    const { io, errors } = quiet();
    expect(addAssembly("cart", "html", nowhere, io)).toBe(1);
    expect(existsSync(nowhere)).toBe(false);
    expect(errors.join()).toContain(`there is no project at ${nowhere}`);
  });

  // The agent surface's add goes through the root guard; the command line's wrote wherever
  // the path led.
  it("writes nothing through a link that leads out of the project", () => {
    const root = project();
    const outside = mkdtempSync(join(tmpdir(), "outside-"));
    mkdirSync(join(root, "src"));
    symlinkSync(outside, join(root, "src", "assemblies"));
    const { io, errors } = quiet();
    expect(addAssembly("cart", "html", root, io)).toBe(1);
    expect(readdirSync(outside)).toEqual([]);
    expect(errors.join()).toMatch(/src\/assemblies\/cart.* leads out of the project/);
  });

  it("writes nothing through a link that leads nowhere, and says so in a line", () => {
    const root = project();
    mkdirSync(join(root, "src"));
    symlinkSync("no-such-directory", join(root, "src", "assemblies"));
    const { io, errors } = quiet();
    expect(addAssembly("cart", "html", root, io)).toBe(1);
    expect(errors).toHaveLength(1);
    expect(errors.join()).toMatch(/a link that leads nowhere/);
  });

  // check and the dev log said it; the command that had just written the view did not.
  it("says what the view's renderer needs that the project has not installed", () => {
    const root = project();
    const { io, said } = quiet();
    expect(addAssembly("board", "svelte", root, io)).toBe(0);
    expect(said.join("\n")).toContain(
      '"board" is a svelte assembly and @assemblejs/renderer-svelte is not installed: install @assemblejs/renderer-svelte',
    );
    expect(said.join("\n")).toContain(
      "this project has Svelte assemblies and svelte is not installed: install svelte",
    );
  });

  it("says nothing of a renderer the project has installed, or of plain html", () => {
    const { io, said } = quiet();
    expect(addAssembly("panel", "react", installed(), io)).toBe(0);
    expect(said.join("\n")).not.toContain("not installed");
    const plain = quiet();
    expect(addAssembly("cart", "html", project(), plain.io)).toBe(0);
    expect(plain.said.join("\n")).not.toContain("not installed");
  });
});
