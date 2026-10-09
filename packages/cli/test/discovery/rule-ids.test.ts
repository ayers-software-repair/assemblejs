// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { RULE_IDS } from "@assemblejs/cli";

describe("the rules a project problem can name", () => {
  it("are unique kebab-case ids", () => {
    expect(new Set(RULE_IDS).size).toBe(RULE_IDS.length);
    for (const id of RULE_IDS) expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });
});
