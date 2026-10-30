// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { boundedOperation } from "./bounded-operation.js";

for (const scenario of ["bounded before teardown", "outside the cache", "unreadable"]) {
  test(`failed npm diagnostics: ${scenario}`, async () => {
    const source = (
      await readFile(new URL("./run-framework-build.js", import.meta.url), "utf8")
    ).replace(/^import .*;\n/gm, "");
    const status = { textContent: "" };
    const result = { textContent: "" };
    const cachePath = "/home/user/.cache/npm/_logs/probe-debug.log";
    const allowed = scenario !== "outside the cache";
    const path = allowed ? cachePath : "/home/user/private.log";
    const log = "x".repeat(70000) + "\nactual stack end";
    let tornDown = false;
    const reads = [];
    const runtime = {
      spawn: async (_program, args, options = {}) => {
        assert.ok(!options.cwd || options.cwd.startsWith("/"), "spawn cwd must be absolute");
        const failed = args[0] === "install";
        const output = failed
          ? `npm error Maximum call stack size exceeded\nin: ${path}\n`
          : args[0] === "-p"
            ? options.cwd
            : args[0] === "--version"
              ? _program === "npm"
                ? "10.9.2\n"
                : "v24.18.0\n"
              : "scaffolded";
        return {
          output: new ReadableStream({
            start(controller) {
              controller.enqueue(output);
              controller.close();
            },
          }),
          exit: Promise.resolve(failed ? 1 : 0),
          kill() {},
        };
      },
      fs: {
        readFile: async (file) => {
          assert.equal(tornDown, false, "diagnostics read after teardown");
          if (file === "/academy-open-build/package.json")
            return '{"dependencies":{},"devDependencies":{},"scripts":{}}';
          reads.push(file);
          assert.equal(file, cachePath);
          if (scenario === "unreadable") throw new Error("diagnostic unavailable");
          return log;
        },
        writeFile: async () => {},
      },
      teardown() {
        tornDown = true;
      },
    };
    await runInNewContext(`(async () => {${source}})()`, {
      document: {
        querySelector: (selector) =>
          selector === "#status" ? status : selector === "#result" ? result : null,
      },
      crossOriginIsolated: true,
      Vivari: { boot: async () => runtime },
      boundedOperation,
      WritableStream,
    });
    const state = JSON.parse(result.textContent);
    assert.equal(status.textContent, "failed");
    assert.match(state.records.find((record) => record.failure).failure, /npm exited 1/);
    assert.equal(tornDown, true);
    assert.deepEqual(reads, allowed ? [cachePath] : []);
    const diagnostic = state.records.find((record) => record.npmDebugLog);
    if (scenario === "unreadable") {
      assert.equal(diagnostic, undefined);
      assert.match(
        state.records.find((record) => record.npmDebugFailure).npmDebugFailure,
        /diagnostic unavailable/,
      );
    } else if (allowed) assert.equal(diagnostic.output, log.slice(-64000));
    else assert.equal(diagnostic, undefined);
  });
}
