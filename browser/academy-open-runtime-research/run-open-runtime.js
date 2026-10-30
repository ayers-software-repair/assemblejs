// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
/* global document, crossOriginIsolated */
import { Vivari } from "@vivari/core";

const status = document.querySelector("#status");
const result = document.querySelector("#result");
if (!status || !result) throw new Error("incomplete mechanics fixture");
const records = [];
let runtime;
const report = (phase) => {
  status.textContent = phase;
  result.textContent = JSON.stringify({ phase, records });
};
async function bounded(promise, label, milliseconds = 10000) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_done, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} deadline exceeded`)), milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
async function finite(code, expected) {
  const process = await bounded(runtime.spawn("node", ["-e", code]), "spawn");
  const record = { program: "node", code, output: "", exit: null };
  records.push(record);
  const reading = process.output.pipeTo(
    new WritableStream({
      write(chunk) {
        record.output = (record.output + chunk).slice(-4000);
      },
    }),
  );
  try {
    [record.exit] = await bounded(Promise.all([process.exit, reading]), "process/output exit");
    if (record.exit !== expected)
      throw new Error(`node exited ${record.exit}, expected ${expected}`);
  } catch (error) {
    process.kill();
    throw error;
  }
  report("running");
}

try {
  if (!crossOriginIsolated) throw new Error("isolated research origin required");
  report("booting");
  runtime = await bounded(Vivari.boot({ serviceWorkerUrl: false }), "boot", 30000);
  await bounded(runtime.mount({ "lesson.txt": { file: { contents: "assembly proof" } } }), "mount");
  const before = await bounded(runtime.fs.readFile("/lesson.txt", "utf-8"), "host read");
  if (before !== "assembly proof") throw new Error("mount/read mismatch");
  await finite(
    'const fs = require("node:fs"); fs.writeFileSync("/result.txt", fs.readFileSync("/lesson.txt", "utf8")); process.stdout.write("finite proof\\n");',
    0,
  );
  const after = await bounded(runtime.fs.readFile("/result.txt", "utf-8"), "process file readback");
  if (after !== before) throw new Error("process/host filesystem mismatch");
  await finite('process.stdout.write("deliberate nonzero exit\\n"); process.exit(7);', 7);
  runtime.teardown();
  records.push({ fileRoundTrip: after, teardownCalledAfterFiniteExits: true });
  runtime = undefined;
  report("passed");
} catch (error) {
  records.push({ failure: String(error) });
  try {
    runtime?.teardown();
  } catch (cleanupError) {
    records.push({ cleanupFailure: String(cleanupError) });
  }
  report("failed");
}
