// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawn } from "node:child_process";
import { createServer as createSocket } from "node:net";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

interface Ran {
  readonly code: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

const CORE = fileURLToPath(new URL("../../dist/index.js", import.meta.url));

/** Runs `serve` in a process of its own, as a server file does, against the built package. */
async function runServe(project: string, environment: Record<string, string> = {}): Promise<Ran> {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !name.startsWith("ASSEMBLEJS_")),
  );
  // After a start, the process is ended by hand: a server that is listening never would.
  const script = `import { serve } from ${JSON.stringify(CORE)};
await serve(${project});
process.exit(process.exitCode ?? 0);`;
  const child = spawn(process.execPath, ["--input-type=module", "-e", script], {
    env: { ...env, ...environment },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk: Buffer) => (stdout += String(chunk)));
  child.stderr.on("data", (chunk: Buffer) => (stderr += String(chunk)));
  const code = await new Promise<number | null>((resolve) => child.on("exit", resolve));
  return { code, stdout, stderr };
}

/** A port nothing is listening on, asked of the system. */
async function freePort(): Promise<number> {
  const probe = createSocket();
  await new Promise<void>((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const address = probe.address();
  await new Promise((resolve) => probe.close(resolve));
  if (address === null || typeof address === "string") throw new Error("no port was given");
  return address.port;
}

const EMPTY = "{ assemblies: [] }";
const NO_STACK = /^\s+at /m;

describe("serve", () => {
  it("starts a project, says its configuration and where it listens, and leaves the exit code alone", async () => {
    const port = await freePort();
    const ran = await runServe(EMPTY, { ASSEMBLEJS_PORT: String(port) });
    expect(ran.code).toBe(0);
    expect(ran.stdout.split("\n")).toEqual([
      "mode  production",
      "host  127.0.0.1",
      `port  ${port}`,
      "auth  off",
      `listening http://127.0.0.1:${port}`,
      "",
    ]);
    expect(ran.stderr).toBe("");
  }, 20000);

  it("prints a refusal at boot as its sentences, and exits 1", async () => {
    const port = await freePort();
    const ran = await runServe('{ assemblies: [{ name: "empty", views: {} }] }', {
      ASSEMBLEJS_PORT: String(port),
    });
    expect(ran.code).toBe(1);
    expect(ran.stdout).toBe("");
    expect(ran.stderr).toBe('assembly "empty" has no "default" view\n');
    expect(ran.stderr).not.toMatch(NO_STACK);
  }, 20000);

  it("prints every problem in the configuration, and exits 1", async () => {
    const ran = await runServe(EMPTY, { ASSEMBLEJS_PORT: "abc", ASSEMBLEJS_MODE: "staging" });
    expect(ran.code).toBe(1);
    expect(ran.stdout).toBe("");
    expect(ran.stderr.split("\n")).toEqual([
      'ASSEMBLEJS_MODE is "staging", which is not one of development or production. Unset it for production.',
      'ASSEMBLEJS_PORT is "abc", which is not a whole number.',
      "",
    ]);
    expect(ran.stderr).not.toMatch(NO_STACK);
  }, 20000);

  it("names the address when it cannot listen there, and exits 1", async () => {
    const taken = createSocket();
    await new Promise<void>((resolve) => taken.listen(0, "127.0.0.1", resolve));
    const address = taken.address();
    if (address === null || typeof address === "string") throw new Error("no port was given");
    try {
      const ran = await runServe(EMPTY, { ASSEMBLEJS_PORT: String(address.port) });
      expect(ran.code).toBe(1);
      expect(ran.stdout).toBe("");
      expect(ran.stderr).toBe(
        `cannot listen on 127.0.0.1:${address.port}: something is already listening there.\n`,
      );
      expect(ran.stderr).not.toMatch(NO_STACK);
    } finally {
      await new Promise((resolve) => taken.close(resolve));
    }
  }, 20000);

  it("lets anything that is not a refusal be a stack", async () => {
    const port = await freePort();
    const ran = await runServe('{ get assemblies() { throw new Error("a bug"); } }', {
      ASSEMBLEJS_PORT: String(port),
    });
    expect(ran.code).toBe(1);
    expect(ran.stderr).toContain("Error: a bug");
    expect(ran.stderr).toMatch(NO_STACK);
  }, 20000);
});
