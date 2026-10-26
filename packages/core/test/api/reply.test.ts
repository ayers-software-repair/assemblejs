// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { isReply, reply } from "@asmjs/core";

// R-16, the owner's "Apis learn who is asking, pages do not" (2026-10-12): an api may answer
// with a status, a cookie or a redirect, through one maker a plain JSON answer can never be
// mistaken for.
describe("an api's reply", () => {
  it("is told apart from a JSON answer, whatever that answer holds", () => {
    expect(isReply(reply({ status: 201 }))).toBe(true);
    expect(isReply({ status: 201 })).toBe(false);
    expect(isReply({ status: 201, body: { ok: true } })).toBe(false);
    expect(isReply(null)).toBe(false);
    expect(isReply("ok")).toBe(false);
  });

  it("carries a status, headers, cookies and a body, each as given", () => {
    const made = reply({
      status: 201,
      headers: { "cache-control": "no-store" },
      cookies: { session: { value: "s1", httpOnly: true, path: "/", sameSite: "lax" } },
      body: { ok: true },
    });
    expect(made.status).toBe(201);
    expect(made.headers).toEqual({ "cache-control": "no-store" });
    expect(made.cookies).toEqual({
      session: { value: "s1", httpOnly: true, path: "/", sameSite: "lax" },
    });
    expect(made.body).toEqual({ ok: true });
  });

  it("answers 200 and nothing else when asked for nothing in particular", () => {
    const made = reply({});
    expect(made.status).toBe(200);
    expect(made.headers).toEqual({});
    expect(made.cookies).toEqual({});
    expect(made.body).toBeUndefined();
  });

  it("redirects with 303 unless told another status, so a form lands on a page", () => {
    expect(reply.redirect("/thanks")).toMatchObject({
      status: 303,
      headers: { location: "/thanks" },
    });
    expect(reply.redirect("/moved", 301).status).toBe(301);
  });
});
