// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { apiProblems, defineApi } from "@assemblejs/core";

const handle = () => ({});

describe("what is checked about apis before anything listens", () => {
  it("passes a well formed set, including one path under two methods", () => {
    expect(
      apiProblems([
        defineApi({ path: "/api/time", handle }),
        defineApi({ path: "/api/items/:id", handle }),
        defineApi({ path: "/api/items/:id", method: "DELETE", handle }),
      ]),
    ).toEqual([]);
  });

  it("refuses the same method and path declared twice, GET being the default", () => {
    const problems = apiProblems([
      defineApi({ path: "/api/time", handle }),
      defineApi({ path: "/api/time", method: "GET", handle }),
    ]);
    expect(problems.join()).toMatch(/GET "\/api\/time" is declared more than once/);
  });

  it("refuses two paths that differ only in a parameter's name, which match the same requests", () => {
    const problems = apiProblems([
      defineApi({ path: "/api/items/:id", handle }),
      defineApi({ path: "/api/items/:key", handle }),
    ]);
    expect(problems.join()).toMatch(/declared more than once/);
  });

  it("refuses a path that does not start with a slash", () => {
    expect(apiProblems([defineApi({ path: "api/time", handle })]).join()).toMatch(
      /does not start with "\/"/,
    );
  });

  it("refuses a path under either reserved prefix, whatever its case", () => {
    for (const path of [
      "/assembly",
      "/assembly/cart/",
      "/Assembly/cart",
      "/_assemblejs",
      "/_assemblejs/health",
    ]) {
      expect(apiProblems([defineApi({ path, handle })]).join()).toMatch(/reserves/);
    }
  });

  it("allows a path that merely begins with a reserved word", () => {
    expect(apiProblems([defineApi({ path: "/assembly-line", handle })])).toEqual([]);
    expect(apiProblems([defineApi({ path: "/_assemblejs-notes", handle })])).toEqual([]);
  });

  it("refuses a wildcard, because routes are a flat table with parameters", () => {
    expect(apiProblems([defineApi({ path: "/api/*", handle })]).join()).toMatch(/wildcard/);
  });

  it("refuses a parameter that is not a whole segment, and markers that match nothing", () => {
    for (const path of [
      "/a/:id?",
      "/a/:id(^\\d+)",
      "/a/:b-:c",
      "/a/::x",
      "/x?y",
      "/x#y",
      "//x",
      "/./x",
      "/a/..",
      "/a/:id/:id",
    ]) {
      expect(apiProblems([defineApi({ path, handle })]).join()).toMatch(/not a flat path/);
    }
  });

  it("accepts the flat grammar, a trailing slash included", () => {
    for (const path of ["/", "/api/v1.2/items_list/", "/api/:id", "/a/:b/c/:d"]) {
      expect(apiProblems([defineApi({ path, handle })])).toEqual([]);
    }
  });

  it("reports every problem, not the first", () => {
    expect(apiProblems([defineApi({ path: "assembly/*", handle })]).length).toBe(2);
  });
});
