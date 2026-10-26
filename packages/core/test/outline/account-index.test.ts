// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { accountIndex } from "@asmjs/core/outline";

describe("an account's placements, by the id on each envelope", () => {
  it("holds every one at any depth", () => {
    const index = accountIndex({
      route: "/",
      ms: 1,
      placements: [
        {
          id: "a",
          name: "shell",
          view: "default",
          source: "local",
          ms: 1,
          children: [
            {
              id: "b",
              name: "nav",
              view: "default",
              source: "local",
              ms: 1,
              children: [{ id: "c", name: "menu", view: "default", source: "cache", ms: 0 }],
            },
          ],
        },
      ],
    });
    expect([...index.keys()]).toEqual(["a", "b", "c"]);
    expect(index.get("c")?.name).toBe("menu");
  });

  it("is empty for a page the server gave no account of", () => {
    expect(accountIndex(undefined).size).toBe(0);
  });
});
