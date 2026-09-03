// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { readCompositionHeaders } from "@assemblejs/core";

const UUID_A = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const UUID_B = "9f8b7c6d-1e2f-4a3b-8c9d-0e1f2a3b4c5d";

describe("reading the composition headers", () => {
  it("treats a request with none of them as the page itself", () => {
    const read = readCompositionHeaders({}, 8);
    expect(read).toEqual({
      ok: true,
      headers: { page: undefined, id: undefined, depth: 0, path: [] },
    });
  });

  it("reads a well formed fragment request", () => {
    const read = readCompositionHeaders(
      {
        "assembly-page": UUID_A,
        "assembly-id": UUID_B,
        "assembly-depth": "2",
        "assembly-path": "page/default,cart/default",
      },
      8,
    );
    expect(read.ok).toBe(true);
    expect(read.ok && read.headers.depth).toBe(2);
    expect(read.ok && read.headers.path).toEqual(["page/default", "cart/default"]);
  });

  // The named rule: malformed is refused, never coerced. Coercing "abc" to depth 0 is how a
  // bounded recursion becomes unbounded while the refusal reports success.
  it("refuses a depth that is not a whole number rather than defaulting it", () => {
    const read = readCompositionHeaders({ "assembly-depth": "abc" }, 8);
    expect(read.ok).toBe(false);
    expect(read.ok === false && read.problems[0]?.header).toBe("assembly-depth");
  });

  it("refuses a depth above the cap", () => {
    expect(readCompositionHeaders({ "assembly-depth": "9" }, 8).ok).toBe(false);
    expect(readCompositionHeaders({ "assembly-depth": "8" }, 8).ok).toBe(true);
  });

  it("refuses an id that is not a uuid", () => {
    expect(readCompositionHeaders({ "assembly-id": "not-a-uuid" }, 8).ok).toBe(false);
    expect(readCompositionHeaders({ "assembly-page": "../../etc/passwd" }, 8).ok).toBe(false);
  });

  it("refuses a path that is not identities", () => {
    expect(readCompositionHeaders({ "assembly-path": "not-an-identity" }, 8).ok).toBe(false);
    expect(readCompositionHeaders({ "assembly-path": "a/b,,c/d" }, 8).ok).toBe(false);
    expect(readCompositionHeaders({ "assembly-path": "a/b/c" }, 8).ok).toBe(false);
  });

  it("refuses a path longer than the cap, whatever the depth header says", () => {
    const long = Array.from({ length: 9 }, (_, index) => `a${index}/default`).join(",");
    expect(readCompositionHeaders({ "assembly-path": long }, 8).ok).toBe(false);
  });

  it("reports every problem, not the first", () => {
    const read = readCompositionHeaders(
      { "assembly-id": "nope", "assembly-depth": "x", "assembly-path": "bad" },
      8,
    );
    expect(read.ok === false && read.problems).toHaveLength(3);
  });
});
