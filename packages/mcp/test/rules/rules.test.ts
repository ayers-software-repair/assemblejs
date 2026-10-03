// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { RULES } from "@assemblejs/mcp";

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

  it("answers every rule a problem anywhere in the command line names, so explain never misses", () => {
    const ids = new Set(RULES.map((rule) => rule.id));
    const named = new Set<string>();
    const walk = (at: string): void => {
      for (const entry of readdirSync(at, { withFileTypes: true })) {
        const path = join(at, entry.name);
        if (entry.isDirectory()) walk(path);
        else
          for (const match of readFileSync(path, "utf8").matchAll(/rule: "([a-z-]+)"/g)) {
            named.add(match[1] ?? "");
          }
      }
    };
    walk(fileURLToPath(new URL("../../../cli/src/", import.meta.url)));
    walk(fileURLToPath(new URL("../../src/author/", import.meta.url)));
    expect(named.size).toBeGreaterThan(5);
    expect([...named].filter((id) => !ids.has(id))).toEqual([]);
  });
});
