// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { projectFiles, realIo, runCheck } from "@assemblejs/cli";
import type { Io } from "@assemblejs/cli";

const capture = () => {
  const logs: string[] = [];
  const errors: string[] = [];
  const io: Io = { ...realIo, log: (line) => logs.push(line), error: (line) => errors.push(line) };
  return { io, logs, errors };
};

const generated = () => {
  const root = mkdtempSync(join(tmpdir(), "check-"));
  for (const [path, contents] of Object.entries(projectFiles("checked"))) {
    realIo.write(join(root, path), contents);
  }
  return root;
};

describe("the check verb", () => {
  // B-20's proof, its first half: a generated project passes check.
  it("passes a project the command line generated, and says so", async () => {
    const { io, logs, errors } = capture();
    expect(await runCheck(generated(), io)).toBe(0);
    expect(errors).toEqual([]);
    expect(logs).toEqual(["no problems"]);
  });

  it("reports each problem with its file, rule and fix, and fails", async () => {
    const root = generated();
    realIo.write(
      join(root, "src", "pages", "home", "home.html"),
      '<assembly name="nowhere"></assembly>',
    );
    const { io, logs, errors } = capture();
    expect(await runCheck(root, io)).toBe(1);
    expect(logs).toEqual([]);
    expect(errors[0]).toMatch(/home\.html: .*nowhere.* \([a-z-]+\): .+/);
    expect(errors.at(-1)).toBe("1 problem(s)");
  });

  it("holds the project's tokens to their contrast, with the project's other findings", async () => {
    const root = generated();
    realIo.write(
      join(root, "src", "tokens.css"),
      ":root { --ink: #9a9a9a; --surface: #ffffff; }\n",
    );
    const { io, errors } = capture();
    expect(await runCheck(root, io)).toBe(1);
    expect(errors[0]).toMatch(
      /^src\/tokens\.css: --ink on --surface is [0-9.]+:1 in the light scheme; text needs 4\.5:1 \(WCAG 2\.2, 1\.4\.3\) \(tokens-hold-their-contrast\): rebind/,
    );
  });
});
