// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { admitFor } from "@asmjs/core";
import type { AccessPolicy, AccessRequest, LogLine } from "@asmjs/core";

const policy = (over: Partial<AccessPolicy>): AccessPolicy => ({
  basic: undefined,
  authenticate: undefined,
  publicRoutes: [],
  ...over,
});
const basic = { user: "ada", password: "pw" };
const signed = { authorization: `Basic ${Buffer.from("ada:pw").toString("base64")}` };
const silent = (): void => undefined;

describe("whether a visitor may be shown a placement of one of this server's assemblies", () => {
  it("is asked of nothing where no control is on: everyone is let in everywhere", () => {
    expect(admitFor(policy({}), {}, silent)).toBeUndefined();
    expect(admitFor(policy({ publicRoutes: ["/public/*"] }), {}, silent)).toBeUndefined();
  });

  it("is the decision the assembly's own address would make of what this visitor sent", async () => {
    const guest = admitFor(policy({ basic }), {}, silent);
    const member = admitFor(policy({ basic }), signed, silent);
    expect(await guest?.("badge", "default")).toEqual({ admitted: false });
    expect(await member?.("badge", "default")).toEqual({ admitted: true });
  });

  it("lets anyone in where an address the assembly answers at is public", async () => {
    const open = (...publicRoutes: string[]) =>
      admitFor(policy({ basic, publicRoutes }), {}, silent);
    expect(await open("/assembly/badge/*")?.("badge", "wide")).toEqual({ admitted: true });
    // Its default view answers at the bare name and under its own.
    expect(await open("/assembly/badge/")?.("badge", "default")).toEqual({ admitted: true });
    expect(await open("/assembly/badge/default/")?.("badge", "default")).toEqual({
      admitted: true,
    });
    // A named view answers at its own address alone, and a public page opens no assembly.
    expect(await open("/assembly/badge/")?.("badge", "wide")).toEqual({ admitted: false });
    expect(await open("/public/*", "/")?.("badge", "default")).toEqual({ admitted: false });
  });

  it("asks the product's own check as a GET of the address, with what the visitor sent", async () => {
    const asked: AccessRequest[] = [];
    const admit = admitFor(
      policy({
        authenticate: (request) => {
          asked.push(request);
          return request.headers["x-team"] === "shop" && request.path.startsWith("/assembly/cart/");
        },
      }),
      { "x-team": "shop" },
      silent,
    );
    expect(await admit?.("cart", "wide")).toEqual({ admitted: true });
    expect(await admit?.("ledger", "wide")).toEqual({ admitted: false });
    expect(asked).toEqual([
      { method: "GET", path: "/assembly/cart/wide/", headers: { "x-team": "shop" } },
      { method: "GET", path: "/assembly/ledger/wide/", headers: { "x-team": "shop" } },
    ]);
  });

  it("asks once for an assembly and a view, however often the request places them", async () => {
    let asked = 0;
    const admit = admitFor(policy({ authenticate: () => (asked += 1) > 0 }), {}, silent);
    await Promise.all([admit?.("cart", "wide"), admit?.("cart", "wide"), admit?.("cart", "wide")]);
    expect(asked).toBe(1);
    // Another view is another address, and so is another assembly.
    await admit?.("cart", "narrow");
    await admit?.("price", "wide");
    expect(asked).toBe(3);
  });

  it("asks the second address of a default view only where the first refuses", async () => {
    const paths: string[] = [];
    const only = (wanted: string) =>
      admitFor(
        policy({ authenticate: ({ path }) => paths.push(path) > 0 && path === wanted }),
        {},
        silent,
      );
    expect(await only("/assembly/cart/")?.("cart", "default")).toEqual({ admitted: true });
    expect(paths.splice(0)).toEqual(["/assembly/cart/"]);
    expect(await only("/assembly/cart/default/")?.("cart", "default")).toEqual({ admitted: true });
    expect(paths.splice(0)).toEqual(["/assembly/cart/", "/assembly/cart/default/"]);
  });

  it("refuses where the check throws, and logs what it threw against the id the refusal carries", async () => {
    const logged: LogLine[] = [];
    const admit = admitFor(
      policy({
        authenticate: () => {
          throw new Error("the check broke");
        },
      }),
      {},
      (line) => logged.push(line),
    );
    const refused = await admit?.("cart", "wide");
    expect(refused).toEqual({ admitted: false, correlationId: expect.any(String) });
    expect(logged).toHaveLength(1);
    expect(logged[0]?.message).toContain("the check broke");
    expect(refused).toEqual({ admitted: false, correlationId: logged[0]?.correlationId });
  });
});
