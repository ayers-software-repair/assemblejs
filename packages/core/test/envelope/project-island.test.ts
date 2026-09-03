// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { projectIsland } from "@assemblejs/core";
import type { IslandSource } from "@assemblejs/core";

describe("projecting the island payload", () => {
  it("takes the six fields it names", () => {
    const payload = projectIsland({
      id: "a7f3",
      name: "cart",
      view: "default",
      renderer: "svelte",
      data: { total: 2 },
    });
    expect(payload).toEqual({
      id: "a7f3",
      name: "cart",
      view: "default",
      renderer: "svelte",
      data: { total: 2 },
      deferred: false,
    });
  });

  // The named adversarial case. A server context that has grown extra fields must not carry
  // them across the boundary, whatever those fields are.
  it("drops everything it was not asked for, headers and cookies included", () => {
    const wide = {
      id: "a7f3",
      name: "cart",
      view: "default",
      renderer: "svelte",
      data: { total: 2 },
      headers: { authorization: "Bearer super-secret", cookie: "session=abc123" },
      cookies: { session: "abc123" },
      request: { url: "/checkout" },
      children: { inner: "<p>already in the dom</p>" },
      env: { DATABASE_URL: "postgres://user:pw@host/db" },
    };
    // Assigned through a variable so the compiler's excess-property check is not what is being
    // tested here: the runtime projection is.
    const source: IslandSource = wide;
    const payload = projectIsland(source);

    expect(Object.keys(payload).sort()).toEqual([
      "data",
      "deferred",
      "id",
      "name",
      "renderer",
      "view",
    ]);
    const serialised = JSON.stringify(payload);
    for (const secret of [
      "Bearer",
      "super-secret",
      "session=abc123",
      "postgres://",
      "already in the dom",
    ]) {
      expect(serialised).not.toContain(secret);
    }
  });

  it("defaults the deferred flag rather than leaving it absent", () => {
    expect(projectIsland({ id: "a", name: "n", view: "v", renderer: "r", data: {} }).deferred).toBe(
      false,
    );
    expect(
      projectIsland({ id: "a", name: "n", view: "v", renderer: "r", data: {}, deferred: true })
        .deferred,
    ).toBe(true);
  });
});
