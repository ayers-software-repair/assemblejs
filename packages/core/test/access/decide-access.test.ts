// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { decideAccess } from "@assemblejs/core";
import type { AccessPolicy } from "@assemblejs/core";

const request = (path: string, headers: Record<string, string> = {}) => ({
  method: "GET",
  path,
  headers,
});
const policy = (over: Partial<AccessPolicy>): AccessPolicy => ({
  basic: undefined,
  authenticate: undefined,
  publicRoutes: [],
  ...over,
});

describe("whether a request may proceed", () => {
  it("lets everything through when no control is on", async () => {
    expect(await decideAccess(request("/"), policy({}))).toBe(true);
  });

  it("asks the basic credentials when they are on", async () => {
    const basic = { user: "ada", password: "pw" };
    expect(await decideAccess(request("/"), policy({ basic }))).toBe(false);
    const header = `Basic ${Buffer.from("ada:pw").toString("base64")}`;
    expect(await decideAccess(request("/", { authorization: header }), policy({ basic }))).toBe(
      true,
    );
  });

  it("asks the product's check when it is on, and treats a check that throws as a refusal", async () => {
    const authenticate = (r: { headers: Readonly<Record<string, string | undefined>> }) =>
      r.headers["x-ok"] === "1";
    expect(await decideAccess(request("/", { "x-ok": "1" }), policy({ authenticate }))).toBe(true);
    expect(await decideAccess(request("/"), policy({ authenticate }))).toBe(false);
    const broken = () => {
      throw new Error("the session store is down");
    };
    expect(await decideAccess(request("/"), policy({ authenticate: broken }))).toBe(false);
  });

  it("lets a public route through whatever control is on", async () => {
    const basic = { user: "ada", password: "pw" };
    expect(
      await decideAccess(request("/health"), policy({ basic, publicRoutes: ["/health"] })),
    ).toBe(true);
  });
});
