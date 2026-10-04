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
    expect(pageProblems([page("/"), page("/products/all")], [hello], [])).toEqual([]);
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

  it("refuses a page parameter, which nothing yet carries to the assemblies it places", () => {
    expect(pageProblems([page("/products/:id")], [hello], []).join()).toMatch(/has a parameter/);
  });

  it("refuses a route outside the flat grammar, before the router can throw on it", () => {
    for (const route of ["/a/:id?", "/c/:x-:y", "/d?x", "//f", "/b/:id(\\d+)"]) {
      expect(pageProblems([page(route)], [hello], []).join()).toMatch(/not a flat path/);
    }
  });

  it("reports a policy that is not an object, rather than throwing on it", () => {
    const odd = {
      route: "/",
      template: '<assembly name="hello"></assembly>',
      place: { hello: null },
    };
    expect(pageProblems([odd as never], [hello], []).join()).toMatch(/not an object/);
  });

  it("refuses a deadline of zero or less", () => {
    for (const deadline of [0, -1]) {
      const zero = {
        route: "/",
        template: '<assembly name="hello"></assembly>',
        place: { hello: { deadline } },
      };
      expect(pageProblems([zero], [hello], []).join()).toMatch(/positive, finite/);
    }
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

  it("refuses a deferred placement nothing on the page could fill, or policy it never reads", () => {
    const hydrated = { ...hello, name: "live", assets: { css: [], js: ["/x.js"] } };
    const remotes = [{ origin: "https://other.example" }];
    const text = (template: string, place: Record<string, object>) =>
      pageProblems([{ route: "/", template, place }], [hello, hydrated], [], remotes).join();
    const one = (name: string) => `<assembly name="${name}"></assembly>`;
    expect(text(one("live"), { live: { defer: true } })).toBe("");
    // Another assembly's browser half puts the runtime on the page, which fills a static one.
    expect(text(one("live") + one("hello"), { hello: { defer: true } })).toBe("");
    expect(text(one("hello"), { hello: { defer: true } })).toMatch(/nothing would fill it/);
    expect(
      text(one("far"), { far: { defer: true, url: "https://other.example/assembly/far/" } }),
    ).toMatch(/across origins/);
    expect(text(one("live"), { live: { defer: true, deadline: 500 } })).toMatch(/nothing reads/);
    expect(text(one("live"), { live: { defer: true, cache: { ttl: 5 } } })).toMatch(
      /nothing reads/,
    );
  });

  it("refuses a placement from an origin nobody declared, or a url that is not a content endpoint", () => {
    const remote = (url: string) => ({
      route: "/",
      template: '<assembly name="cart"></assembly>',
      place: { cart: { url } },
    });
    const declared = [{ origin: "https://checkout.example.com" }];
    expect(
      pageProblems([remote("https://checkout.example.com/assembly/cart/")], [hello], [], declared),
    ).toEqual([]);
    expect(
      pageProblems(
        [remote("https://evil.example.com/assembly/cart/")],
        [hello],
        [],
        declared,
      ).join(),
    ).toMatch(/not a declared remote/);
    expect(
      pageProblems([remote("https://checkout.example.com/cart")], [hello], [], declared).join(),
    ).toMatch(/not an assembly's content endpoint/);
  });

  it("refuses a placement from another server inside one of the page's forms", () => {
    const origin = "https://shop.example.com";
    const problems = pageProblems(
      [
        {
          route: "/",
          template: '<form><assembly name="cart"></assembly></form>',
          place: { cart: { url: `${origin}/assembly/cart/` } },
        },
      ],
      [],
      [],
      [{ origin }],
    );
    expect(problems.join()).toMatch(/inside a <form>/);
  });

  it("refuses a stream that is not one of this server's streaming apis without parameters", () => {
    const apis = [
      defineApi({ path: "/live", stream: () => undefined }),
      defineApi({ path: "/data", handle: () => null }),
      defineApi({ path: "/rooms/:room", stream: () => undefined }),
    ];
    const scripted = defineAssembly({ ...hello, assets: { css: [], js: ["/client.js"] } });
    const streaming = (stream: string) => [{ ...page("/"), stream }];
    // A query is the stream's own to read; the path is what names it.
    for (const stream of ["/live", "/live?room=a"]) {
      expect(pageProblems(streaming(stream), [scripted], apis), stream).toEqual([]);
    }
    for (const stream of ["/data", "/nowhere", "/rooms/:room"]) {
      expect(pageProblems(streaming(stream), [scripted], apis).join(), stream).toMatch(
        /opens the stream .*, which is not the path of a streaming api without parameters/,
      );
    }
  });

  it("refuses a stream nothing on the page would open", () => {
    const apis = [defineApi({ path: "/live", stream: () => undefined })];
    const still = defineAssembly({ ...hello, mount: "none", assets: { css: [], js: ["/c.js"] } });
    const remotes = [{ origin: "https://shop.example.com" }];
    const remotely = {
      ...page("/"),
      stream: "/live",
      place: { hello: { url: "https://shop.example.com/assembly/hello/" } },
    };
    // No browser half, one that never mounts, and one placed from another server, whose own
    // runtime opens no stream of this page's.
    for (const [pages, assemblies] of [
      [[{ ...page("/"), stream: "/live" }], [hello]],
      [[{ ...page("/"), stream: "/live" }], [still]],
      [[remotely], [defineAssembly({ ...hello, assets: { css: [], js: ["/c.js"] } })]],
    ] as const) {
      expect(pageProblems(pages, assemblies, apis, remotes).join()).toMatch(
        /opens a stream and places no assembly of this server's with a browser half/,
      );
    }
  });
});
