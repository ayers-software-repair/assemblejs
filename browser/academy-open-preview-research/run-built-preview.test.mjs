// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import test from "node:test";
import { runBuiltPreview } from "../academy-open-runtime-research/run-built-preview.js";

for (const scenario of ["interaction", "launch failure", "early exit"]) {
  test(`preview lifecycle: ${scenario}`, async () => {
    let abortSeen = false;
    let stopClick;
    let killed = false;
    let detached = false;
    let resolveExit;
    const exit = new Promise((resolve) => {
      resolveExit = resolve;
    });
    const frame = { src: "" };
    const stop = {
      disabled: true,
      addEventListener: (_event, callback) => {
        stopClick = callback;
      },
      removeEventListener: () => {
        stopClick = undefined;
      },
    };
    const runtime = {
      once: (_event, options = {}) =>
        scenario === "interaction"
          ? Promise.resolve([3210, "/preview/3210/"])
          : new Promise((_resolve, reject) =>
              options.signal?.addEventListener(
                "abort",
                () => {
                  abortSeen = true;
                  reject(new Error("readiness cancelled"));
                },
                { once: true },
              ),
            ),
      spawn: async () => {
        if (scenario === "launch failure") throw new Error("launch failed");
        return {
          output: new ReadableStream({
            start(controller) {
              controller.close();
            },
          }),
          exit: scenario === "early exit" ? Promise.resolve(1) : exit,
          kill() {
            killed = true;
            resolveExit(143);
          },
        };
      },
      previewUrl: () => "/preview/3210/",
      attachPreview: () => () => {
        detached = true;
      },
    };
    const records = [];
    const running = runBuiltPreview(
      runtime,
      "/project",
      records,
      (phase) => {
        if (phase === "server ready") {
          assert.equal(frame.src, "/preview/3210/");
          assert.equal(stop.disabled, false);
          stopClick();
        }
      },
      frame,
      stop,
    );
    if (scenario === "interaction") {
      await running;
      assert.equal(records.at(-1).stoppedServerExit, 143);
      assert.equal(detached, true);
    } else {
      await assert.rejects(
        running,
        scenario === "launch failure" ? /launch failed/ : /before readiness: 1/,
      );
      assert.equal(abortSeen, true, "startup readiness listener was not cancelled");
    }
    if (scenario !== "launch failure") assert.equal(killed, true);
    assert.equal(stopClick, undefined);
  });
}
