// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 11, from the command line the project installed: `check` finds a problem without
// building or starting anything and names the file, the rule and the fix; `deploy` writes a
// directory that runs anywhere Node does, with no bundler and no development dependency in it.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { rootOf, started } from "../http.mjs";

const root = rootOf("plain");
const run = (verb) => spawnSync("npx", ["assemblejs", verb], { cwd: root, encoding: "utf8" });

test("check passes the project as written, building and starting nothing", () => {
  const result = run("check");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /no problems/);
});

test("check refuses a placement with no assembly behind it, naming the file, the rule and the fix", () => {
  const broken = join(root, "src", "pages", "broken");
  mkdirSync(broken, { recursive: true });
  writeFileSync(join(broken, "broken.html"), '<body><assembly name="nothing"></assembly></body>\n');
  try {
    const result = run("check");
    assert.equal(result.status, 1, result.stdout);
    assert.match(
      result.stderr,
      /^src\/pages\/broken\/broken\.html: page "broken" places "nothing", and there is no such assembly \(a-placement-names-an-assembly\): add it, or place one that exists: hello$/m,
    );
    assert.match(result.stderr, /^1 problem\(s\)$/m);
  } finally {
    rmSync(broken, { recursive: true, force: true });
  }
});

test("check refuses policy for a name the template never places, where it is declared", () => {
  const declaration = join(root, "src", "pages", "home", "home.page.ts");
  writeFileSync(declaration, "export default { place: { stale: { defer: true } } };\n");
  try {
    const result = run("check");
    assert.equal(result.status, 1, result.stdout);
    assert.match(
      result.stderr,
      /^src\/pages\/home\/home\.page\.ts: page "home" declares policy for "stale", which its template never places \(policy-names-a-placement\): declare policy only for a name the template places/m,
    );
  } finally {
    rmSync(declaration, { force: true });
  }
});

test("deploy writes a directory that runs on its own, with no bundler and no development dependency", async () => {
  const result = run("deploy");
  assert.equal(result.status, 0, result.stderr);
  const deploy = join(root, "deploy");
  const manifest = JSON.parse(readFileSync(join(deploy, "package.json"), "utf8"));
  assert.deepEqual(manifest.scripts, { start: "node dist/server.js" });
  assert.ok(!("devDependencies" in manifest), "nothing a running server does not need");
  assert.ok("@assemblejs/core" in manifest.dependencies);
  assert.ok(!("@assemblejs/cli" in manifest.dependencies), "the command line is not shipped");
  // Moved away from the project, so nothing of the project's own node_modules is in reach, and
  // installed with what its own package.json says, as a deployment would.
  const elsewhere = mkdtempSync(join(tmpdir(), "assemblejs-deployed-"));
  try {
    cpSync(deploy, elsewhere, { recursive: true });
    execFileSync("npm", ["install", "--omit=dev", "--no-audit", "--no-fund"], {
      cwd: elsewhere,
      stdio: ["ignore", "ignore", "pipe"],
    });
    for (const absent of ["esbuild", "@assemblejs/cli"]) {
      assert.ok(!existsSync(join(elsewhere, "node_modules", absent)), `${absent} was installed`);
    }
    const server = await started(elsewhere, { ASSEMBLEJS_MODE: "production" });
    try {
      assert.ok(server.origin !== undefined, server.output());
      const page = await (await fetch(new URL("/", server.origin))).text();
      assert.match(page, /Hello from AssembleJS/);
      assert.match(page, /<assembly-root\b[^>]*data-name="hello"/);
      assert.equal((await fetch(new URL("/_assemblejs/health", server.origin))).status, 200);
    } finally {
      await server.stop();
    }
  } finally {
    rmSync(elsewhere, { recursive: true, force: true });
  }
});
