// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineService } from "@assemblejs/core";
import type { ReturnedObject } from "@assemblejs/core";

const context = { query: new URLSearchParams(), params: {} };

interface Named {
  ok: boolean;
}

describe("ReturnedObject", () => {
  it("takes a service of two shapes", async () => {
    const service = (coin: boolean) =>
      defineService({
        name: "s",
        run: () => (coin ? { found: false, sku: "x" } : { found: true, product: { name: "n" } }),
      });
    expect(await service(true).run(context)).toEqual({ found: false, sku: "x" });
    expect(await service(false).run(context)).toEqual({ found: true, product: { name: "n" } });
  });

  it("takes an async service of two shapes", async () => {
    const service = (coin: boolean) =>
      defineService({
        name: "s",
        run: async () =>
          coin ? { found: false, sku: "x" } : { found: true, product: { name: "n" } },
      });
    expect(await service(false).run(context)).toEqual({ found: true, product: { name: "n" } });
  });

  it("takes a member declared as possibly undefined, whatever the project's flags", async () => {
    const service = defineService({
      name: "s",
      run: (): { found: boolean; sku: string | undefined } => ({ found: true, sku: undefined }),
    });
    expect(JSON.stringify(await service.run(context))).toBe('{"found":true}');
  });

  it("still refuses what JSON cannot carry", () => {
    // @ts-expect-error A Date is not JSON: it would arrive as a string.
    defineService({ name: "s", run: () => ({ when: new Date() }) });
    // @ts-expect-error A function is dropped by JSON.
    defineService({ name: "s", run: () => ({ run: () => 1 }) });
    // @ts-expect-error A bigint cannot be serialised.
    defineService({ name: "s", run: () => ({ big: 1n }) });
    // @ts-expect-error A service returns an object, not nothing.
    defineService({ name: "s", run: () => undefined });
    // @ts-expect-error An interface has no index signature, so it does not say its members are JSON.
    defineService({ name: "s", run: (): Named => ({ ok: true }) });
    expect(true).toBe(true);
  });

  it("is an object that keeps only the members it has once it is JSON", () => {
    const object: ReturnedObject = { a: 1, b: undefined };
    expect(JSON.stringify(object)).toBe('{"a":1}');
  });
});
