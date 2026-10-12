// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { readArguments } from "@assemblejs/cli";

describe("a command line's arguments, read", () => {
  it("are the words in order, and each flag with its value, written apart or with an equals", () => {
    expect(
      readArguments(["add", "assembly", "cart", "--renderer", "react", "--cwd", "shop"]),
    ).toEqual({
      positional: ["add", "assembly", "cart"],
      flags: new Map([
        ["renderer", "react"],
        ["cwd", "shop"],
      ]),
    });
    expect(readArguments(["--cwd=shop", "check", "--renderer=vue"])).toEqual({
      positional: ["check"],
      flags: new Map([
        ["cwd", "shop"],
        ["renderer", "vue"],
      ]),
    });
    // What follows the equals is the value whole, an equals in it included.
    expect(readArguments(["--cwd=a=b"]).flags.get("cwd")).toBe("a=b");
  });

  it("take a switch as itself: it has no value, and the word after it is a word", () => {
    expect(readArguments(["--help", "build"])).toEqual({
      positional: ["build"],
      flags: new Map([["help", ""]]),
    });
    expect(readArguments(["--version"]).flags.has("version")).toBe(true);
    expect(readArguments(["-v"]).flags.has("version")).toBe(true);
    expect(readArguments(["-h"]).flags.has("help")).toBe(true);
  });

  // Found 2026-10-11: --cwd=dir was a flag named "cwd=dir" that swallowed the next word, and a
  // flag nobody knows was kept in silence with the word after it.
  it("say what cannot be read: a flag nobody knows, a value missing, a value given to a switch", () => {
    expect(readArguments(["add", "assembly", "cart", "--render", "react"]).problem).toMatch(
      /no flag --render/,
    );
    expect(readArguments(["check", "--cwd"]).problem).toMatch(/--cwd needs a value/);
    expect(readArguments(["check", "--cwd", "--help"]).problem).toMatch(/--cwd needs a value/);
    expect(readArguments(["--help=yes"]).problem).toMatch(/--help takes no value/);
    expect(readArguments(["-x"]).problem).toMatch(/no flag -x/);
    expect(readArguments(["check", "--cwd", "shop"]).problem).toBeUndefined();
  });
});
