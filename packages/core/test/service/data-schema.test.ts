// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { DataSchema } from "@assemblejs/core";

describe("the shape of a contributor's data", () => {
  it("is its fields, each with a JSON Schema, and which of them are always present", () => {
    const schema: DataSchema = {
      properties: { greeting: { type: "string" } },
      required: ["greeting"],
    };
    expect(Object.keys(schema.properties)).toEqual(["greeting"]);
  });
});
