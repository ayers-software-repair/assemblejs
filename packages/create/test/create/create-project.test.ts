// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Io } from "@assemblejs/build";
import { describe, expect, it } from "vitest";
import { createProject } from "@assemblejs/create";

const fake = () => {
  const written = new Map<string, string>();
  const errors: string[] = [];
  const io: Io = {
    write: (path, contents) => void written.set(path.replaceAll("\\", "/"), String(contents)),
    exists: () => false,
    remove: () => undefined,
    log: () => undefined,
    error: (line) => errors.push(line),
  };
  return { io, written, errors };
};

describe("npm create @assemblejs", () => {
  it("writes the same project the command line's new writes", () => {
    const { io, written } = fake();
    expect(createProject(["my-app"], io)).toBe(0);
    expect([...written.keys()]).toContain("my-app/src/pages/home/home.html");
    expect([...written.keys()]).toContain("my-app/src/server.ts");
  });

  // `npm create @assemblejs .`, in a directory made for the project, was refused as a name.
  it("makes the project in the directory it runs in, when that is the one named", () => {
    const here = join(mkdtempSync(join(tmpdir(), "create-")), "my-shop");
    mkdirSync(here);
    const bin = fileURLToPath(new URL("../../dist/bin.js", import.meta.url));
    const said = execFileSync(process.execPath, [bin, "."], { cwd: here, encoding: "utf8" });
    expect(JSON.parse(readFileSync(join(here, "package.json"), "utf8"))).toMatchObject({
      name: "my-shop",
    });
    expect(said).toContain("wrote package.json");
    expect(said).not.toContain("cd ");
  });

  it("asks nothing, and says how to call it when it is given no directory or too much", () => {
    for (const argv of [[], [""], ["--help"], ["a", "b"]]) {
      const { io, written, errors } = fake();
      expect(createProject(argv, io)).toBe(2);
      expect(written.size).toBe(0);
      expect(errors.join()).toContain("npm create @assemblejs <directory>");
    }
  });
});
