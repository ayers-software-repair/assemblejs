// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { EventEmitter } from "node:events";
import { describe, expect, it } from "vitest";
import { exitOnUnhandled } from "@assemblejs/core";
import type { LogLine } from "@assemblejs/core";

describe("a failure nothing handled", () => {
  it("is logged against a correlation id, and ends the process", () => {
    const target = new EventEmitter();
    const logged: LogLine[] = [];
    const exits: number[] = [];
    exitOnUnhandled(
      target,
      (line) => logged.push(line),
      (code) => exits.push(code),
    );
    target.emit("unhandledRejection", new Error("nobody waited for this"));
    target.emit("uncaughtException", "thrown, not an Error");
    expect(logged.map((line) => line.message)).toEqual([
      "nobody waited for this",
      "thrown, not an Error",
    ]);
    expect(logged.every((line) => /^[0-9a-f]{8}$/.test(line.correlationId))).toBe(true);
    expect(exits).toEqual([1, 1]);
  });

  it("is handled once per process, however many servers listen in it", () => {
    const target = new EventEmitter();
    exitOnUnhandled(
      target,
      () => undefined,
      () => undefined,
    );
    exitOnUnhandled(
      target,
      () => undefined,
      () => undefined,
    );
    expect(target.listenerCount("unhandledRejection")).toBe(1);
  });
});
