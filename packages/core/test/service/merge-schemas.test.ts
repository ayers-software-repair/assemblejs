// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { mergeSchemas } from "@assemblejs/core";

describe("deep-merging the schemas that compose one view's data", () => {
  it("unions the properties and concatenates the required lists", () => {
    const { schema, problems } = mergeSchemas([
      {
        source: 'service "greeting"',
        schema: { properties: { greeting: { type: "string" } }, required: ["greeting"] },
      },
      {
        source: 'service "count"',
        schema: { properties: { count: { type: "number" } }, required: ["count"] },
      },
    ]);
    expect(problems).toEqual([]);
    expect(schema).toEqual({
      properties: { greeting: { type: "string" }, count: { type: "number" } },
      required: ["greeting", "count"],
    });
  });

  it("refuses a field two contributors both declare, naming both, whatever order they ran in", () => {
    const a = { source: 'service "a"', schema: { properties: { title: { type: "string" } } } };
    const b = { source: 'service "b"', schema: { properties: { title: { type: "string" } } } };
    for (const parts of [
      [a, b],
      [b, a],
    ]) {
      const { problems } = mergeSchemas(parts);
      expect(problems.join()).toMatch(/data field "title" is declared by both/);
      expect(problems.join()).toContain('service "a"');
      expect(problems.join()).toContain('service "b"');
    }
  });

  it("refuses a required field its contributor does not declare, which nothing could satisfy", () => {
    const { problems } = mergeSchemas([
      { source: 'service "a"', schema: { properties: {}, required: ["missing"] } },
    ]);
    expect(problems.join()).toMatch(/requires data field "missing" but does not declare it/);
  });

  it("is empty for nothing to merge", () => {
    expect(mergeSchemas([])).toEqual({ schema: { properties: {}, required: [] }, problems: [] });
  });
});
