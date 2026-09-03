// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { ServiceOrderError, defineService, orderServices } from "@assemblejs/core";

const service = (name: string, after?: readonly string[]) =>
  defineService({ name, ...(after === undefined ? {} : { after }), run: () => ({}) });

const names = (services: readonly { name: string }[]) => services.map((s) => s.name);

describe("ordering services", () => {
  it("keeps declaration order when nothing says otherwise", () => {
    expect(names(orderServices([service("a"), service("b"), service("c")]))).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("puts a service after the one it declared it follows", () => {
    // Declared b, a — but b follows a, so a runs first.
    expect(names(orderServices([service("b", ["a"]), service("a")]))).toEqual(["a", "b"]);
  });

  it("follows a chain", () => {
    expect(names(orderServices([service("c", ["b"]), service("b", ["a"]), service("a")]))).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  // Every way this can be wrong is a boot failure rather than a surprise at request time: a set
  // of services whose order depends on which request arrives first is one nobody can reason about.
  it("refuses a name declared twice", () => {
    expect(() => orderServices([service("a"), service("a")])).toThrow(/more than once/);
  });

  it("refuses an after that names a service nobody declared", () => {
    expect(() => orderServices([service("b", ["ghost"])])).toThrow(/not declared/);
  });

  it("refuses a circle rather than looping", () => {
    expect(() => orderServices([service("a", ["b"]), service("b", ["a"])])).toThrow(
      ServiceOrderError,
    );
    expect(() => orderServices([service("a", ["b"]), service("b", ["a"])])).toThrow(/in a circle/);
  });

  it("reports every problem at once", () => {
    try {
      orderServices([service("a"), service("a"), service("b", ["ghost"])]);
      expect.unreachable("it should have refused");
    } catch (error) {
      expect((error as ServiceOrderError).problems).toHaveLength(2);
    }
  });
});
