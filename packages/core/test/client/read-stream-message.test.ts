// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { readStreamMessage } from "@assemblejs/core/client";

describe("reading a message from a page's stream", () => {
  it("reads a topic, a payload and an optional address by name", () => {
    expect(readStreamMessage('{"topic":"price","payload":{"n":1}}')).toEqual({
      topic: "price",
      payload: { n: 1 },
    });
    expect(readStreamMessage('{"topic":"price","payload":null,"to":{"name":"cart"}}')).toEqual({
      topic: "price",
      payload: null,
      to: { name: "cart" },
    });
  });

  it("drops anything that is not one, rather than delivering it", () => {
    for (const data of [
      "not json",
      "[]",
      "null",
      '"price"',
      '{"payload":1}',
      '{"topic":"","payload":1}',
      '{"topic":7,"payload":1}',
      '{"topic":"price"}',
      '{"topic":"price","payload":1,"to":"cart"}',
      '{"topic":"price","payload":1,"to":{"id":"x"}}',
      '{"topic":"price","payload":1,"to":null}',
    ]) {
      expect(readStreamMessage(data), data).toBeUndefined();
    }
  });
});
