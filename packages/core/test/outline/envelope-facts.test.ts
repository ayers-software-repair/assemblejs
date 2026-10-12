// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { EnvelopeFacts } from "@assemblejs/core/outline";

describe("what an outline says of one assembly", () => {
  it("is a name, what answered, a few words and every fact in the order it is shown", () => {
    const facts: EnvelopeFacts = {
      name: "cart",
      tone: "remote",
      brief: "42 ms",
      rows: [
        ["From", "https://checkout.example.com"],
        ["Answered", "fetched by the server in 42 ms"],
      ],
    };
    expect(facts.rows.map(([label]) => label)).toEqual(["From", "Answered"]);
  });
});
