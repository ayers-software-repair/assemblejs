// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildProject, realIo } from "@assemblejs/cli";
import type { Io } from "@assemblejs/cli";

const example = fileURLToPath(new URL("../../../../examples/two-frameworks/", import.meta.url));
const capture = () => {
  const logs: string[] = [];
  const errors: string[] = [];
  const io: Io = { ...realIo, log: (line) => logs.push(line), error: (line) => errors.push(line) };
  return { io, logs, errors };
};

/** Starts a built server under plain node and answers what it serves at a path. */
const serve = async (root: string, path: string): Promise<string> => {
  const port = String(20000 + Math.floor(Math.random() * 20000));
  const child = spawn(process.execPath, ["dist/server.js"], {
    cwd: root,
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

describe("building a project", () => {
  it("writes a server that plain node starts, composing the page from both frameworks", async () => {
    const { io, logs } = capture();
    expect(await buildProject(example, io)).toBe(0);
    expect(logs.join()).toContain("built 3 assembly(s), 1 page(s), 1 api(s)");
    expect(readFileSync(join(example, ".assemblejs", "project.ts"), "utf8")).toMatch(
      /version: "[0-9a-f]{12}"/,
    );
    const page = await serve(example, "/");
    expect(page).toContain('data-renderer="svelte"');
    expect(page).toContain("Clicked 0");
    expect(page).toContain('<p id="readout">nothing yet</p>');
    expect(page).toMatch(
      /<script type="module" src="\/_assemblejs\/assets\/client-[A-Z0-9]+\.js">/,
    );
    expect(JSON.parse(await serve(example, "/api/time"))).toHaveProperty("now");
  });

  it("refuses, before bundling, a project it cannot build, saying every reason", async () => {
    const root = mkdtempSync(join(tmpdir(), "broken-"));
    mkdirSync(join(root, "src", "assemblies", "a"), { recursive: true });
    writeFileSync(join(root, "package.json"), "{}");
    writeFileSync(join(root, "src", "assemblies", "a", "a.angular.tsx"), "");
    const { io, errors } = capture();
    expect(await buildProject(root, io)).toBe(1);
    expect(errors.join()).toMatch(/cannot build yet/);
    expect(errors.join()).toMatch(/no src\/server\.ts/);
    expect(existsSync(join(root, "dist"))).toBe(false);
  });

  it("reports a source the bundler cannot read, with its file and line", async () => {
    const root = mkdtempSync(join(tmpdir(), "syntax-"));
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(join(root, "package.json"), "{}");
    writeFileSync(join(root, "src", "server.ts"), "export const = ;");
    const { io, errors } = capture();
    expect(await buildProject(root, io)).toBe(1);
    expect(errors.join()).toMatch(/server\.ts:1/);
  });
});
