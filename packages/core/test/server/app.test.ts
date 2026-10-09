// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
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

  // DESIGN 12, in a real process: once listening, a rejection nothing handled is logged against
  // a correlation id and the process ends, rather than running on in a state nothing accounted for.
  it("ends its process, logged, on a failure nothing handled once it listens", async () => {
    const core = fileURLToPath(new URL("../../dist/index.js", import.meta.url));
    const script = `import { createServer } from ${JSON.stringify(core)};
const app = await createServer({ config: { mode: "production", host: "127.0.0.1", port: 0, auth: undefined }, assemblies: [] });
await app.listen();
Promise.reject(new Error("nobody waited for this"));`;
    const child = spawn(process.execPath, ["--input-type=module", "-e", script], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => (stderr += String(chunk)));
    const code = await new Promise<number | null>((resolve) => child.on("exit", resolve));
    expect(code).toBe(1);
    const line = JSON.parse(stderr.trim().split("\n").at(-1) ?? "{}") as Record<string, string>;
    expect(line["message"]).toBe("nobody waited for this");
    expect(line["correlationId"]).toMatch(/^[0-9a-f]{8}$/);
  }, 20000);
});
