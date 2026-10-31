// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import { test } from "node:test";
import { Window } from "happy-dom";
import { createAssemblyControls } from "./create-assembly-controls.js";

const fixture = () => {
  const window = new Window();
  const document = window.document;
  const calls = [];
  const view = createAssemblyControls(document.body, {
    async callTool(request) {
      calls.push(request);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ok: true,
              problems: [],
              result:
                request.name === "plan_assembly"
                  ? {
                      id: "review",
                      changes: [
                        {
                          path: "src/note.html",
                          before: null,
                          after: "<script>unsafe()</script><p>Real proposed source</p>",
                        },
                      ],
                    }
                  : request.name === "check"
                    ? { findings: [] }
                    : request.name === "discard_assembly_plan"
                      ? { discarded: "review", written: [] }
                      : { written: ["src/note.html"] },
            }),
          },
        ],
      };
    },
  });
  const button = (text) =>
    [...document.querySelectorAll("button")].find((node) => node.textContent === text);
  const mode = (value) => {
    const select = document.querySelector('[aria-label="Agent mode"]');
    select.value = value;
    select.dispatchEvent(new window.Event("change"));
  };
  return { document, calls, view, button, mode };
};

test("Plan displays escaped exact additions and never exposes an enabled approval", async () => {
  const { document, calls, button } = fixture();
  button("Plan assembly").click();
  await setImmediate();
  assert.equal(calls.length, 1);
  assert.equal(button("Approve changes").disabled, true);
  assert.equal(
    document.querySelector("ins").textContent,
    "<script>unsafe()</script><p>Real proposed source</p>",
  );
  assert.equal(document.querySelectorAll("script").length, 0);
});

test("mode changes preserve the proposal without authorizing it; reject calls discard", async () => {
  const { calls, button, mode } = fixture();
  button("Plan assembly").click();
  await setImmediate();
  mode("auto");
  assert.equal(calls.length, 1);
  assert.equal(button("Approve changes").disabled, true);
  mode("approval");
  assert.equal(button("Approve changes").disabled, false);
  button("Reject proposal").click();
  await setImmediate();
  assert.deepEqual(
    calls.map((call) => call.name),
    ["plan_assembly", "discard_assembly_plan"],
  );
  assert.equal(button("Approve changes").disabled, true);
});

test("explicit Approval and a new Auto request reach shared apply/check operations", async () => {
  const { document, calls, button, mode } = fixture();
  mode("approval");
  button("Propose changes").click();
  await setImmediate();
  button("Approve changes").click();
  await setImmediate();
  assert.deepEqual(
    calls.map((call) => call.name),
    ["plan_assembly", "apply_assembly_plan", "check"],
  );
  assert.match(
    document.querySelector('[role="status"]').textContent,
    /Placement, build and preview still need verification/,
  );
  mode("auto");
  button("Add assembly and check").click();
  await setImmediate();
  assert.deepEqual(
    calls.slice(3).map((call) => call.name),
    ["plan_assembly", "apply_assembly_plan", "check"],
  );
});

test("disposing a pending Plan response does not recreate the panel", async () => {
  const { document, view, button, calls } = fixture();
  button("Plan assembly").click();
  view.destroy();
  await setImmediate();
  assert.equal(document.body.children.length, 0);
  assert.deepEqual(
    calls.map((call) => call.name),
    ["plan_assembly"],
  );
});
