// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { findPlacements, placementProblems } from "@assemblejs/core";
import type { PlacedAssembly } from "@assemblejs/core";

const assemblies = new Map<string, PlacedAssembly>([
  ["hello", { views: ["default"], browserHalf: false }],
  ["live", { views: ["default", "wide"], browserHalf: true }],
]);
const one = (name: string, view?: string) =>
  `<assembly name="${name}"${view === undefined ? "" : ` view="${view}"`}></assembly>`;
const found = (template: string, place: Record<string, unknown> = {}) =>
  placementProblems('page "/"', findPlacements(template), place, assemblies);
const messages = (template: string, place: Record<string, unknown> = {}) =>
  found(template, place).map((problem) => problem.message);

describe("what is wrong with how a page places assemblies", () => {
  it("finds nothing wrong with a placement of what exists, policy or not", () => {
    expect(found(one("hello") + one("live", "wide"), { live: { deadline: 500 } })).toEqual([]);
  });

  it("refuses a placement with no assembly behind it, naming the assembly", () => {
    expect(found(one("nope"))).toEqual([
      {
        name: "nope",
        about: "assembly",
        message: 'page "/" places "nope", and there is no such assembly',
      },
    ]);
  });

  it("refuses a placement of a view the assembly does not have, naming the view", () => {
    expect(found(one("hello", "wide"))).toEqual([
      {
        name: "hello",
        about: "view",
        message: 'page "/" places "hello" with a view "wide" it does not have',
      },
    ]);
  });

  it("holds a placement from another server to nothing here: its url is for whoever reads it", () => {
    expect(found(one("far"), { far: { url: "https://other.example/assembly/far/" } })).toEqual([]);
  });

  it("refuses policy that is not an object, and policy for a name the template never places", () => {
    const problems = found(one("hello"), { hello: "soon", stale: {} });
    expect(problems.map((problem) => problem.about)).toEqual(["policy", "policy"]);
    expect(messages(one("hello"), { hello: "soon", stale: {} })).toEqual([
      'page "/" declares policy for "hello" that is not an object',
      'page "/" declares policy for "stale", which its template never places',
    ]);
  });

  it("refuses a placement both deferred and required", () => {
    expect(messages(one("live"), { live: { defer: true, required: true } })).toEqual([
      'page "/" declares "live" both deferred and required',
    ]);
  });

  it("refuses a deferral nothing could fill: from another server, or on a page with no runtime", () => {
    expect(
      messages(one("far") + one("live"), {
        far: { defer: true, url: "https://other.example/assembly/far/" },
      }).join(),
    ).toMatch(/across origins/);
    expect(messages(one("hello"), { hello: { defer: true } }).join()).toMatch(
      /nothing would fill it/,
    );
    // Another assembly's browser half puts the runtime on the page, which fills a static one.
    expect(messages(one("hello") + one("live"), { hello: { defer: true } })).toEqual([]);
  });

  it("refuses a deadline or a cache on a deferral, which nothing reads", () => {
    expect(messages(one("live"), { live: { defer: true, deadline: 5 } }).join()).toMatch(
      /nothing reads/,
    );
    expect(messages(one("live"), { live: { defer: true, cache: { ttl: 5 } } }).join()).toMatch(
      /nothing reads/,
    );
  });

  it("refuses a deadline that is not a positive, finite number", () => {
    for (const deadline of [0, -1, Number.POSITIVE_INFINITY, Number.NaN]) {
      expect(messages(one("hello"), { hello: { deadline } }).join()).toMatch(/positive, finite/);
    }
  });
});
