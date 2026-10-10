// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Diagnostic } from "@assemblejs/core";
import { describe, expect, it } from "vitest";
import { fallbackProblems } from "@assemblejs/mcp";

const placed = (name: string, over: Partial<Diagnostic> = {}): Diagnostic => ({
  name,
  view: "default",
  id: `id-${name}`,
  source: "local",
  ms: 0,
  ...over,
});
const fell = (name: string, reason: Diagnostic["reason"], correlationId?: string): Diagnostic =>
  placed(name, {
    source: "fallback",
    ...(reason === undefined ? {} : { reason }),
    ...(correlationId === undefined ? {} : { correlationId }),
  });

describe("what an agent is told about placements that fell back", () => {
  it("is nothing when every placement was answered by its own content", () => {
    expect(
      fallbackProblems([placed("cart", { children: [placed("price")] })], ["cart"], []),
    ).toEqual([]);
  });

  it("is what a render threw, found by the id the failure was logged against", () => {
    const logged = [{ correlationId: "c-1", message: "counter needs a build", stack: undefined }];
    expect(fallbackProblems([fell("counter", "status", "c-1")], ["counter"], logged)).toEqual([
      "counter needs a build",
    ]);
  });

  it("names what exists for a name with no assembly, and otherwise the rung and the reason", () => {
    expect(fallbackProblems([fell("nope", "status")], ["cart"], [])).toEqual([
      'there is no assembly "nope". This project has: cart',
    ]);
    expect(fallbackProblems([fell("cart", "timeout")], ["cart"], [])).toEqual([
      '"cart" was answered by the fallback after timeout',
    ]);
  });

  it("reads every depth, says where a child stands, and says each thing once", () => {
    const tree = [
      placed("shell", { children: [fell("loop", "cycle"), fell("loop", "cycle")] }),
      placed("shell", { children: [placed("card", { children: [fell("nope", "status")] })] }),
    ];
    expect(fallbackProblems(tree, ["shell", "card", "loop"], [])).toEqual([
      '"loop" inside "shell" was answered by the fallback after cycle',
      'there is no assembly "nope". This project has: shell, card, loop',
    ]);
  });
});
