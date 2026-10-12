// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { RULE_IDS } from "@assemblejs/build";
import { describe, expect, it } from "vitest";
import { RULES } from "@assemblejs/check";

describe("what the framework knows", () => {
  it("gives every rule a reason and a smell, not just a sentence", () => {
    expect(RULES.length).toBeGreaterThan(5);
    for (const rule of RULES) {
      expect(rule.because.length).toBeGreaterThan(40);
      expect(rule.smell.length).toBeGreaterThan(10);
    }
  });

  it("has unique ids, so an agent can ask about one", () => {
    expect(new Set(RULES.map((rule) => rule.id)).size).toBe(RULES.length);
  });

  it("covers the constraints an agent would otherwise have to infer from the api", () => {
    const ids = RULES.map((rule) => rule.id);
    for (const needed of [
      "one-framework-per-assembly",
      "directory-is-an-assembly",
      "nothing-crosses-but-json",
      "every-placement-has-a-deadline",
      "no-default-credential",
    ]) {
      expect(ids).toContain(needed);
    }
  });

  // Each is a rule a finding names from beneath the checks, where its words cannot be read.
  it("says why of the rules the build's own findings name", () => {
    const rule = (id: string) => RULES.find((one) => one.id === id);
    expect(rule("a-source-file-compiles")?.because).toMatch(/cannot see/);
    expect(rule("a-project-stays-inside-its-root")?.because).toMatch(
      /an agent is shown what they read/,
    );
    expect(rule("a-project-stays-inside-its-root")?.rule).toMatch(/a link that leads nowhere/);
  });

  it("answers every rule a project problem can name, so explain never misses one", () => {
    const ids = new Set(RULES.map((rule) => rule.id));
    expect(RULE_IDS.filter((id) => !ids.has(id))).toEqual([]);
  });
});
