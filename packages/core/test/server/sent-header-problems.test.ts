// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { BootError, createServer, defineAssembly, sentHeaderProblems } from "@assemblejs/core";
import type { ServerOptions } from "@assemblejs/core";

const cart = defineAssembly({
  name: "cart",
  views: { default: { renderer: "html", markup: () => "<p>cart</p>" } },
});
const config = { mode: "production", host: "127.0.0.1", port: 3000, auth: undefined } as const;
const boots = (options: Partial<ServerOptions>) =>
  createServer({ config, assemblies: [cart], log: () => undefined, ...options });

describe("what is checked about the values this server sends as headers", () => {
  it("passes a value a header can carry, and one that was left out", () => {
    expect(
      sentHeaderProblems({
        "the content security policy": "default-src 'self'; img-src 'self' data:",
        "the version": undefined,
      }),
    ).toEqual([]);
  });

  it("refuses a value written over more than one line, naming it", () => {
    expect(
      sentHeaderProblems({ "the content security policy": "default-src 'self';\n img-src *" }),
    ).toEqual([
      "the content security policy holds a character no response header can carry, such as a line break; write it on one line",
    ]);
  });

  it("refuses what the platform itself refuses to write, a character past its range among them", () => {
    for (const value of ["1.0\r\n2", "1.0\u0000", "1.0-\u2603"]) {
      expect(sentHeaderProblems({ "the version": value }), JSON.stringify(value)).toHaveLength(1);
    }
    expect(sentHeaderProblems({ "the version": "1.0.0-next.3+caf\u00e9" })).toEqual([]);
  });
});

// Each of these booted, and then answered every request it sent the value on with a 500 whose
// body was the platform's own description of the fault.
describe("a server given a value no header can carry", () => {
  it("does not start on such a content security policy", async () => {
    await expect(
      boots({ contentSecurityPolicy: "default-src 'self';\n img-src *" }),
    ).rejects.toThrow(BootError);
    await expect(
      boots({ contentSecurityPolicy: "default-src 'self';\n img-src *" }),
    ).rejects.toThrow(/the content security policy holds a character/);
  });

  it("does not start on such a version", async () => {
    await expect(boots({ version: "1.0\n2" })).rejects.toThrow(/the version holds a character/);
  });

  it("starts on values a header carries, and sends them", async () => {
    const app = await boots({ contentSecurityPolicy: "default-src 'self'", version: "7.1" });
    const content = await app.inject({ method: "GET", url: "/assembly/cart/" });
    expect(content.statusCode).toBe(200);
    expect(content.headers["assembly-version"]).toBe("7.1");
    expect(content.headers["content-security-policy"]).toBe("default-src 'self'");
    await app.close();
  });
});
