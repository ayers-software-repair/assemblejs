// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { contentSecurityPolicy } from "@assemblejs/core";

describe("the default content security policy", () => {
  it("allows this origin and the declared remotes, and nothing inline or framed", () => {
    const policy = contentSecurityPolicy(["https://checkout.example.com"]);
    expect(policy).toContain("script-src 'self' https://checkout.example.com");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'self'");
    expect(policy).not.toContain("unsafe-inline");
    expect(policy).not.toContain("unsafe-eval");
  });

  it("is exactly this, so a directive cannot be dropped or widened unnoticed", () => {
    expect(contentSecurityPolicy(["https://r.example"])).toBe(
      "default-src 'self'; script-src 'self' https://r.example; style-src 'self' https://r.example; " +
        "connect-src 'self' https://r.example; img-src 'self' https://r.example data:; " +
        "font-src 'self' https://r.example; object-src 'none'; base-uri 'self'; " +
        "frame-ancestors 'self'; form-action 'self'",
    );
  });

  it("is this origin alone with no remotes", () => {
    expect(contentSecurityPolicy([])).toContain("script-src 'self';");
  });
});
