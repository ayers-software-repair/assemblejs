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
  it("passes a project the command line generated, and says so", () => {
    const { io, logs, errors } = capture();
    expect(runCheck(generated(), io)).toBe(0);
    expect(errors).toEqual([]);
    expect(logs).toEqual(["no problems"]);
  });

  it("reports each problem with its file, rule and fix, and fails", () => {
    const root = generated();
    realIo.write(
      join(root, "src", "pages", "home", "home.html"),
      '<assembly name="nowhere"></assembly>',
    );
    const { io, logs, errors } = capture();
    expect(runCheck(root, io)).toBe(1);
    expect(logs).toEqual([]);
    expect(errors[0]).toMatch(/home\.html: .*nowhere.* \([a-z-]+\): .+/);
    expect(errors.at(-1)).toBe("1 problem(s)");
  });
});
