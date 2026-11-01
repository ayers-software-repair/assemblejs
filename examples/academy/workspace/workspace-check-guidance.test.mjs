// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import { test } from "node:test";
import { academyWorkspaceFixture } from "./academy-workspace-fixture.mjs";

test("a timed-out tutor read cannot retain the workspace preview lock", async () => {
  let resolve;
  let hold = true;
  const f = await academyWorkspaceFixture((data) => ({
    callTool(request) {
      if (request.name === "read_source_version" && hold) {
        hold = false;
        return new Promise((done) => {
          resolve = done;
        });
      }
      return data.client.callTool(request);
    },
  }));
  const originalSet = globalThis.setTimeout;
  const originalClear = globalThis.clearTimeout;
  const marker = {};
  let expire;
  globalThis.setTimeout = (callback, delay, ...args) => {
    if (delay === 30000) {
      expire = callback;
      return marker;
    }
    return originalSet(callback, delay, ...args);
  };
  globalThis.clearTimeout = (timer) => {
    if (timer !== marker) originalClear(timer);
  };
  try {
    const before = [...f.files];
    const input = f.document.querySelector('[aria-label="Ask guided tutor"]');
    input.value = "Check and explain";
    input.closest("form").dispatchEvent(new f.window.Event("submit", { cancelable: true }));
    assert.equal(typeof expire, "function");
    expire();
    const answer = f.document.querySelector('[aria-label="Tutor answer"]');
    assert.match(answer.textContent, /timed out/);
    assert.deepEqual(f.runtimeCalls, []);
    assert.equal(
      (await f.view.refresh()).ok,
      true,
      "manual preview must not wait for the expired tutor read",
    );
    assert.equal(
      [...f.document.querySelectorAll("button")].find(
        (button) => button.textContent === "Stop preview",
      ).disabled,
      false,
    );
    assert.equal((await f.view.stop()).ok, true);
    resolve(f.answer({ version: "a".repeat(12) }));
    await setImmediate();
    assert.match(answer.textContent, /timed out/);
    assert.deepEqual([...f.files], before);
    assert.deepEqual(f.runtimeCalls, ["build", "stop"]);
    assert.equal(
      f.calls.some((call) => call.name === "apply_source_changes"),
      false,
    );
  } finally {
    f.close();
    globalThis.setTimeout = originalSet;
    globalThis.clearTimeout = originalClear;
  }
});
