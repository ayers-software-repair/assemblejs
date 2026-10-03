// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { freePort, projectFiles, realIo, runDeploy } from "@assemblejs/cli";
import type { Io } from "@assemblejs/cli";

// Nested in an example, so the deploy resolves the workspace's packages as one whose
// dependencies were installed would.
const example = fileURLToPath(new URL("../../../../examples/two-frameworks/", import.meta.url));
const root = mkdtempSync(join(example, ".dev-deploy-"));
afterAll(() => rmSync(root, { recursive: true, force: true }));

const quiet: Io = { ...realIo, log: () => undefined, error: () => undefined };

/** Starts the deployed server from inside deploy/, and answers what it serves at a path. */
const serveDeploy = async (path: string): Promise<string> => {
  const port = String(await freePort());
  const child = spawn(process.execPath, ["dist/server.js"], {
    cwd: join(root, "deploy"),
    env: { ...process.env, ASSEMBLEJS_PORT: port },
    stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    const origin = await new Promise<string>((resolve, reject) => {
      child.stdout.on("data", (chunk: Buffer) => {
        const found = /listening (http:\/\/\S+)/.exec(String(chunk));
        if (found?.[1] !== undefined) resolve(found[1]);
      });
      child.on("exit", (code) => reject(new Error(`exited with ${String(code)}`)));
    });
    return await (await fetch(`${origin}${path}`)).text();
  } finally {
    child.kill();
  }
};

describe("the deploy verb", { timeout: 60_000 }, () => {
  // B-20's proof, its second half: deploy writes a build that runs.
  it("writes deploy/, a build that runs from where it was written", async () => {
    for (const [path, contents] of Object.entries(projectFiles("shipped"))) {
      realIo.write(join(root, path), contents);
    }
    realIo.write(join(root, "deploy", "stale.txt"), "from an earlier deploy");
    expect(await runDeploy(root, quiet)).toBe(0);
    expect(existsSync(join(root, "deploy", "stale.txt"))).toBe(false);
    const manifest = JSON.parse(
      readFileSync(join(root, "deploy", "package.json"), "utf8"),
    ) as Record<string, unknown>;
    expect(manifest["scripts"]).toEqual({ start: "node dist/server.js" });
    expect(manifest).not.toHaveProperty("devDependencies");
    expect(await serveDeploy("/")).toContain("Hello from AssembleJS");
  });

  it("refuses a directory that is not a project, and writes nothing when the build fails", async () => {
    const empty = mkdtempSync(join(tmpdir(), "not-a-project-"));
    expect(await runDeploy(empty, quiet)).toBe(1);
    const broken = mkdtempSync(join(tmpdir(), "broken-"));
    writeFileSync(join(broken, "package.json"), "{}");
    expect(await runDeploy(broken, quiet, async () => 1)).toBe(1);
    expect(existsSync(join(broken, "deploy"))).toBe(false);
  });
});
