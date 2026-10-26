// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { DataApi, ReturnedValue } from "@asmjs/core";

// The type is pinned where it is used, as an api's handler: each line below must compile, or be
// refused by its `@ts-expect-error`, which fails the type check when the line is not refused.
const handler = (handle: DataApi["handle"]): DataApi["handle"] => handle;
const context = {
  query: new URLSearchParams(),
  params: {},
  body: undefined,
  headers: {},
  cookies: {},
};

type Placed = { ok: true; id: string } | { ok: false; problems: string[] };
type Loose = { ok: boolean; id?: string };
type Absent = { ok: boolean; id: string | undefined };
interface Named {
  ok: boolean;
}

describe("ReturnedValue", () => {
  it("takes one expression that answers one of two shapes", async () => {
    const handle = (coin: boolean) =>
      handler(() => (coin ? { ok: false, problems: ["x"] } : { ok: true, id: "1" }));
    expect(await handle(true)(context)).toEqual({ ok: false, problems: ["x"] });
    expect(await handle(false)(context)).toEqual({ ok: true, id: "1" });
  });

  it("takes two returns of two shapes", async () => {
    const handle = (coin: boolean) =>
      handler(() => {
        if (coin) return { ok: false, problems: ["x"] };
        return { ok: true, id: "1" };
      });
    expect(await handle(true)(context)).toEqual({ ok: false, problems: ["x"] });
  });

  it("takes an async handler of two shapes", async () => {
    const handle = (coin: boolean) =>
      handler(async () => (coin ? { ok: false, problems: ["x"] } : { ok: true, id: "1" }));
    expect(await handle(false)(context)).toEqual({ ok: true, id: "1" });
  });

  it("takes a declared union of the two shapes", async () => {
    const handle = (coin: boolean) =>
      handler((): Placed => (coin ? { ok: false, problems: ["x"] } : { ok: true, id: "1" }));
    expect(await handle(true)(context)).toEqual({ ok: false, problems: ["x"] });
  });

  it("takes one shape with an optional member", async () => {
    const handle = handler((): Loose => ({ ok: true }));
    expect(await handle(context)).toEqual({ ok: true });
  });

  it("takes a member declared as possibly undefined, whatever the project's flags", async () => {
    // Unlike the shapes above, which a project that turns on `exactOptionalPropertyTypes` was
    // already given, this is refused by `JsonValue` in every project.
    const handle = handler((): Absent => ({ ok: true, id: undefined }));
    expect(JSON.stringify(await handle(context))).toBe('{"ok":true}');
  });

  it("still refuses what JSON cannot carry", () => {
    // @ts-expect-error A Date is not JSON: it would arrive as a string.
    handler(() => ({ when: new Date() }));
    // @ts-expect-error A function is dropped by JSON.
    handler(() => ({ run: () => 1 }));
    // @ts-expect-error A bigint cannot be serialised.
    handler(() => ({ big: 1n }));
    // @ts-expect-error A member may be absent, but the answer as a whole may not.
    handler(() => undefined);
    // @ts-expect-error An interface has no index signature, so it does not say its members are JSON.
    handler((): Named => ({ ok: true }));
    expect(true).toBe(true);
  });

  it("is JSON once an absent member is dropped", () => {
    const value: ReturnedValue = [{ a: 1, b: undefined }, null, "x"];
    expect(JSON.parse(JSON.stringify(value))).toEqual([{ a: 1 }, null, "x"]);
  });
});
