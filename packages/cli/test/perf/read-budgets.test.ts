// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { readBudgets } from "@assemblejs/cli";

describe("the page budgets a config declares", () => {
  it("reads each part's bytes as written, and none from a config that declares none", () => {
    expect(
      readBudgets("export default defineConfig({ budgets: { document: 20000, scripts: 60000 } });"),
    ).toEqual({ budgets: { document: 20000, scripts: 60000 }, problems: [] });
    expect(readBudgets("export default defineConfig({ remotes: [] });")).toEqual({
      budgets: {},
      problems: [],
    });
  });

  it("refuses a part a page does not send, a budget that is not whole bytes above zero, and a computed one", () => {
    const { budgets, problems } = readBudgets(
      "export default { budgets: { fonts: 1, styles: 0, scripts: 1.5, document: process.env.D } };",
    );
    expect(budgets).toEqual({});
    expect(problems).toEqual([
      'budgets names "fonts", which is not a part a page sends: document, styles, scripts',
      "the budget for styles is not a whole number of bytes above zero; write it as one",
      "the budget for scripts is not a whole number of bytes above zero; write it as one",
      "the budget for document is computed; write it as one",
    ]);
    expect(readBudgets("export default { budgets: 5 };").problems).toEqual([
      "budgets is not an object of parts and bytes",
    ]);
    const odd =
      "export default { budgets: { document: { a: 1 }, styles: -5, scripts: Infinity } };";
    expect(readBudgets(odd).problems.map((problem) => problem.split(";")[0])).toEqual([
      "the budget for document is not a whole number of bytes above zero",
      "the budget for styles is not a whole number of bytes above zero",
      "the budget for scripts is computed",
    ]);
    // Computed whole: a shared constant is a budget perf cannot read, never one it has none of.
    expect(readBudgets("const b = shared();\nexport default { budgets: b };").problems).toEqual([
      "budgets is computed; write it as an object of parts and bytes",
    ]);
    expect(readBudgets("export default { budgets: { document: 5, ...b } };").problems).toEqual([
      "budgets has a spread or a computed key; write every part as its name and bytes",
    ]);
  });

  it("refuses a config not written as one literal object, unless budgets are written beside it", () => {
    const unread = /the config is not written as one literal object/;
    for (const source of [
      "export default { ...base };",
      "export default defineConfig(load());",
      "export default { [key]: 1 };",
    ]) {
      expect(readBudgets(source).problems.join(), source).toMatch(unread);
    }
    expect(readBudgets("export default { ...base, budgets: {} };")).toEqual({
      budgets: {},
      problems: [],
    });
    expect(readBudgets("export default { ...base, budgets: { styles: 7 } };").budgets).toEqual({
      styles: 7,
    });
  });

  it("throws for a config that cannot be compiled, for the caller to report", () => {
    expect(() => readBudgets("export default {")).toThrow();
  });
});
