// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

test("buffered dev output cannot replace a terminal stop failure", async () => {
  const source = (await readFile(new URL("./project-probe.mjs", import.meta.url), "utf8")).replace(
    /^import .*;\n/gm,
    "",
  );
  const files = new Map([
    [
      "academy-sdk/package.json",
      JSON.stringify({ dependencies: { "@asmjs/core": "1.0.0-next.2" }, devDependencies: {} }),
    ],
    ["academy-sdk/src/pages/home/home.html", "<body></body>"],
    ["probe-parent.json", '{"origin":"http://127.0.0.1:1234"}'],
    ["probe-control.json", '{"action":"stop"}'],
  ]);
  const reports = [];
  const kills = [];
  const process = { env: {}, versions: { node: "22.22.3" }, exitCode: 0 };
  let checks = 0;
  let bufferedOutput = 0;
  await runInNewContext(`(async () => {${source}})()`, {
    process,
    readFileSync: (path) => {
      assert.ok(files.has(path), `unexpected file read: ${path}`);
      return files.get(path);
    },
    writeFileSync: (path, contents) => files.set(path, contents),
    renameSync: (from, to) => {
      files.set(to, files.get(from));
      if (to === "probe-result.json") reports.push(JSON.parse(files.get(to)));
    },
    spawn: (_program, args) => {
      const child = new EventEmitter();
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      if (args.at(-1) === "dev") {
        child.kill = (signal = "SIGTERM") => {
          kills.push(signal);
          if (signal === "SIGKILL")
            queueMicrotask(() => {
              bufferedOutput++;
              child.stdout.emit("data", "buffered shutdown output");
              child.emit("close", null, signal);
            });
          return true;
        };
      } else {
        child.kill = () => true;
        const bad = args.at(-1) === "check" && checks++ === 0;
        queueMicrotask(() => {
          child.stdout.emit("data", bad ? "a-placement-names-an-assembly missing-probe" : "ok");
          child.emit("close", bad ? 1 : 0);
        });
      }
      return child;
    },
    setTimeout: (callback, milliseconds) => {
      if (milliseconds === 5000) queueMicrotask(callback);
      return 1;
    },
    clearTimeout() {},
    setInterval: (callback) => {
      queueMicrotask(callback);
      return 1;
    },
    clearInterval() {},
  });
  for (let tick = 0; tick < 12; tick++) await Promise.resolve();
  assert.equal(bufferedOutput, 1);
  assert.deepEqual(kills, ["SIGTERM", "SIGKILL"]);
  assert.equal(process.exitCode, 1);
  assert.equal(reports.at(-1).phase, "failed");
  assert.match(reports.at(-1).records.at(-1).failure, /dev process did not stop/);
});
