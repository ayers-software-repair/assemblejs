// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { Io } from "@assemblejs/cli";

describe("what a command does to the world outside itself", () => {
  it("is four operations, passed in rather than reached for", () => {
    const written: string[] = [];
    const io: Io = {
      write: (path) => written.push(path),
      exists: () => false,
      log: () => {},
      error: () => {},
    };
    io.write("a", "b");
    // A test drives the real command instead of a rehearsal of it, and nothing touches a disk.
    expect(written).toEqual(["a"]);
  });
});
