// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { describeConfig } from "@assemblejs/core";

describe("describing the configuration for the banner", () => {
  it("shows what the server actually read", () => {
    const lines = describeConfig({
      mode: "production",
      host: "0.0.0.0",
      port: 8080,
      auth: undefined,
    });
    expect(lines.join("\n")).toContain("mode  production");
    expect(lines.join("\n")).toContain("port  8080");
    expect(lines.join("\n")).toContain("auth  off");
  });

  // A banner that echoes a secret puts it in every log and every deploy recording.
  it("never prints the password", () => {
    const lines = describeConfig({
      mode: "production",
      host: "127.0.0.1",
      port: 3000,
      auth: { user: "ops", password: "hunter2-the-real-secret" },
    });
    const banner = lines.join("\n");
    expect(banner).toContain("basic, user ops");
    expect(banner).not.toContain("hunter2-the-real-secret");
  });
});
