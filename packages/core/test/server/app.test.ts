// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { createServer } from "@assemblejs/core";

describe("a built server", () => {
  it("exposes inject, listen and close", async () => {
    const app = await createServer({
      config: { mode: "production", host: "127.0.0.1", port: 0, auth: undefined },
      assemblies: [],
    });
    expect(typeof app.inject).toBe("function");
    expect(typeof app.listen).toBe("function");
    expect(typeof app.close).toBe("function");
    await app.close();
  });
});
