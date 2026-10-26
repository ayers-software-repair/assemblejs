// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { createServer, defineAssembly, requestedPath } from "@asmjs/core";

describe("the path a request asked for, as the router reads it", () => {
  it("is the path without its query, as written, when nothing in it is encoded", () => {
    expect(requestedPath("/admin/users?page=2")).toBe("/admin/users");
    expect(requestedPath("/")).toBe("/");
    expect(requestedPath("/assembly/cart/default/api/")).toBe("/assembly/cart/default/api/");
  });

  it("is the address an encoded spelling spells, each segment decoded once", () => {
    expect(requestedPath("/%61dmin/users")).toBe("/admin/users");
    expect(requestedPath("/assembly/secre%74/")).toBe("/assembly/secret/");
    expect(requestedPath("/item/a%20b?x=%61")).toBe("/item/a b");
    // Once: what an encoded percent sign leaves is not decoded again, as the router does not.
    expect(requestedPath("/%2561dmin")).toBe("/%61dmin");
  });

  it("keeps an encoded slash encoded, so decoding never joins two segments or splits one", () => {
    expect(requestedPath("/item/a%2Fb")).toBe("/item/a%2Fb");
    expect(requestedPath("/assembly/open%2f..%2fsecret/")).toBe("/assembly/open%2F..%2Fsecret/");
  });

  it("is none for a segment that does not decode, which the router refuses as well", () => {
    expect(requestedPath("/%zz")).toBeUndefined();
    expect(requestedPath("/admin/%")).toBeUndefined();
    expect(requestedPath("/%C3")).toBeUndefined();
  });
});

describe("the path, given the route that answers it", () => {
  it("ends in a slash exactly where the route does", () => {
    expect(requestedPath("/admin/", "/admin")).toBe("/admin");
    expect(requestedPath("/admin/?x=1", "/admin")).toBe("/admin");
    expect(requestedPath("/assembly/cart", "/assembly/:name/")).toBe("/assembly/cart/");
    expect(requestedPath("/assembly/cart/", "/assembly/:name/")).toBe("/assembly/cart/");
    expect(requestedPath("/%61dmin/", "/admin")).toBe("/admin");
    expect(requestedPath("/", "/")).toBe("/");
  });

  it("is read as asked where no route answers it, or a wildcard does", () => {
    expect(requestedPath("/nowhere/")).toBe("/nowhere/");
    expect(requestedPath("/assembly/x/", "/assembly/*")).toBe("/assembly/x/");
  });

  it("is what a server decides access of, a guarded address guarded in both spellings", async () => {
    const seen: string[] = [];
    const guarded = await createServer({
      config: { mode: "production", host: "127.0.0.1", port: 0, auth: undefined },
      log: () => undefined,
      assemblies: [
        defineAssembly({
          name: "secret",
          views: { default: { renderer: "html", markup: () => "<p>members only</p>" } },
        }),
      ],
      pages: [{ route: "/admin", template: "<p>the admin page</p>" }],
      // Exact spellings only, so a slash the decision did not read as the route's would pass.
      authenticate: ({ path, headers }) => {
        seen.push(path);
        if (headers["x-member"] === "yes") return true;
        return path !== "/admin" && path !== "/assembly/secret/";
      },
    });
    try {
      for (const [asked, spelled] of [
        ["/admin/", "/admin"],
        ["/admin", "/admin"],
        ["/assembly/secret", "/assembly/secret/"],
        ["/assembly/secret/", "/assembly/secret/"],
      ] as const) {
        seen.length = 0;
        const refused = await guarded.inject({ method: "GET", url: asked });
        expect(refused.statusCode, asked).toBe(401);
        expect(refused.body).not.toContain("admin page");
        expect(refused.body).not.toContain("members only");
        expect(seen).toEqual([spelled]);
        const admitted = await guarded.inject({
          method: "GET",
          url: asked,
          headers: { "x-member": "yes" },
        });
        expect(admitted.statusCode, asked).toBe(200);
      }
    } finally {
      await guarded.close();
    }
  });
});
