// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineApi, defineAssembly, pageProblems } from "@assemblejs/core";

const hello = defineAssembly({
  name: "hello",
  views: { default: { renderer: "html", markup: () => "<p>hi</p>" } },
});
const page = (route: string, template = '<assembly name="hello"></assembly>') => ({
  route,
  template,
});

describe("what is checked about pages before anything listens", () => {
  it("passes a well formed set", () => {
    expect(pageProblems([page("/"), page("/products/:id")], [hello], [])).toEqual([]);
  });

  it("refuses a placement with no assembly behind it, rather than leaving a blank space", () => {
    expect(
      pageProblems([page("/", '<assembly name="nope"></assembly>')], [hello], []).join(),
    ).toMatch(/places "nope", and there is no such assembly/);
  });

  it("refuses a placement of a view the assembly does not have", () => {
    expect(
      pageProblems(
        [page("/", '<assembly name="hello" view="wide"></assembly>')],
        [hello],
        [],
      ).join(),
    ).toMatch(/view "wide" it does not have/);
  });

  it("refuses a template the composer cannot read", () => {
    expect(
      pageProblems([page("/", '<assembly nam="hello"></assembly>')], [hello], []).join(),
    ).toMatch(/unknown attribute/);
  });

  it("refuses the same route twice, and a route an api already answers", () => {
    expect(pageProblems([page("/a/:id"), page("/a/:key")], [hello], []).join()).toMatch(
      /declared more than once/,
    );
    const api = defineApi({ path: "/status", handle: () => ({}) });
    expect(pageProblems([page("/status")], [hello], [api]).join()).toMatch(
      /also declared as an api/,
    );
  });

  it("allows a page beside an api that answers a different method on the same path", () => {
    const api = defineApi({ path: "/form", method: "POST", handle: () => ({}) });
    expect(pageProblems([page("/form")], [hello], [api])).toEqual([]);
  });

  it("refuses a route that is not a flat, rooted, unreserved path", () => {
    expect(pageProblems([page("home")], [hello], []).join()).toMatch(/does not start with/);
    expect(pageProblems([page("/docs/*")], [hello], []).join()).toMatch(/wildcard/);
    expect(pageProblems([page("/_assemblejs/x")], [hello], []).join()).toMatch(/reserves/);
  });

  it("refuses policy for a placement the template never makes, which nothing would read", () => {
    const stale = { route: "/", template: "<main></main>", place: { hello: {} } };
    expect(pageProblems([stale], [hello], []).join()).toMatch(/never places/);
  });

  it("refuses a placement both deferred and required, and a deadline that is not finite", () => {
    const both = {
      route: "/",
      template: '<assembly name="hello"></assembly>',
      place: { hello: { defer: true, required: true, deadline: Number.POSITIVE_INFINITY } },
    };
    const text = pageProblems([both], [hello], []).join();
    expect(text).toMatch(/both deferred and required/);
    expect(text).toMatch(/positive, finite/);
  });

  it("refuses a placement from another server, which this version cannot fetch yet", () => {
    const remote = {
      route: "/",
      template: '<assembly name="cart"></assembly>',
      place: { cart: { url: "https://checkout.example.com/assembly/cart/" } },
    };
    expect(pageProblems([remote], [hello], []).join()).toMatch(/cannot fetch yet/);
  });
});
