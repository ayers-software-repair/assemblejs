// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Io } from "@assemblejs/cli";
import { describe, expect, it } from "vitest";
import { createProject } from "@assemblejs/create";

const fake = () => {
  const written = new Map<string, string>();
  const errors: string[] = [];
  const io: Io = {
    write: (path, contents) => void written.set(path.replaceAll("\\", "/"), contents),
    exists: () => false,
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

  it("asks nothing, and says how to call it when it is given no directory or too much", () => {
    for (const argv of [[], [""], ["--help"], ["a", "b"]]) {
      const { io, written, errors } = fake();
      expect(createProject(argv, io)).toBe(2);
      expect(written.size).toBe(0);
      expect(errors.join()).toContain("npm create @assemblejs <directory>");
    }
  });
});
