// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AssemblyDefinition, Diagnostic } from "@assemblejs/core";
import { defineAssembly, pageAccount } from "@assemblejs/core";

const html = (name: string, js: readonly string[] = []): AssemblyDefinition =>
  defineAssembly({
    name,
    views: { default: { renderer: "html", markup: () => "<p></p>" } },
    assets: { css: [], js: [...js] },
  });
const assemblies = new Map(
  [html("shell"), html("cart", ["/cart.js"]), html("tally")].map((one) => [one.name, one]),
);
const at = (
  name: string,
  source: Diagnostic["source"],
  more: Partial<Diagnostic> = {},
): Diagnostic => ({ name, view: "default", id: `id-${name}`, source, ms: 1.26, ...more });

describe("the account of a page that its outline is told", () => {
  it("names every field it holds, so what a failure threw never reaches a visitor", () => {
    const account = pageAccount(
      { route: "/shop", ms: 12.345 },
      [
        at("cart", "fallback", {
          reason: "invalid",
          correlationId: "c-1",
          cause: "connection to postgres://user:hunter2@db refused",
        }),
      ],
      {},
      assemblies,
    );
    expect(account).toEqual({
      route: "/shop",
      ms: 12.3,
      placements: [{ id: "id-cart", name: "cart", view: "default", source: "fallback", ms: 1.3 }],
    });
    expect(JSON.stringify(account)).not.toMatch(/hunter2|c-1|invalid/);
  });

  it("is a tree, as the composer's is, with what a request refused past its limit", () => {
    const account = pageAccount(
      { route: "/", ms: 1 },
      [
        at("shell", "local", { children: [at("cart", "local"), at("tally", "cache")] }),
        at("tally", "fallback", { refused: 3, reason: "too-many" }),
      ],
      {},
      assemblies,
    );
    expect(account.placements[0]?.children?.map((child) => child.name)).toEqual(["cart", "tally"]);
    expect(account.placements[1]?.refused).toBe(3);
  });

  it("says whether an assembly of this server mounts, and nothing of one it cannot know", () => {
    const account = pageAccount(
      { route: "/", ms: 1 },
      [
        at("shell", "local", { children: [at("cart", "local")] }),
        at("cart", "deferred"),
        at("tally", "remote"),
        at("cart", "fallback"),
        at("gone", "cache"),
      ],
      {
        tally: {
          name: "tally",
          view: "default",
          url: "https://b.example/assembly/tally/",
          deadline: 1,
        },
      },
      assemblies,
    );
    const [shell, deferred, remote, fallback, unknown] = account.placements;
    expect(shell?.browser).toBe(false);
    expect(shell?.children?.[0]?.browser).toBe(true);
    expect(deferred?.browser).toBe(true);
    expect(remote).not.toHaveProperty("browser");
    expect(fallback).not.toHaveProperty("browser");
    expect(unknown).not.toHaveProperty("browser");
  });
});
