// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { Window } from "happy-dom";
import { calculatorFixture } from "./calculator-fixture.mjs";
import { CalculatorModes } from "./calculator-modes.js";
import { createModeWalkthrough } from "./create-mode-walkthrough.js";

const fixture = (clientOf = (data) => data.client) => {
  const data = calculatorFixture();
  const window = new Window();
  const guide = createModeWalkthrough(window.document.body);
  const modes = new CalculatorModes(clientOf(data), data.recipe, (state) => guide.update(state));
  const heading = () => window.document.querySelector("h2").textContent;
  return {
    ...data,
    window,
    guide,
    modes,
    heading,
    close() {
      guide.destroy();
      window.close();
    },
  };
};
const rejectFirst = async (f, request = "Add a calculator") => {
  await f.modes.request(request);
  assert.match(f.heading(), /^2\./);
  f.modes.mode("approval");
  await f.modes.reject();
  assert.match(f.heading(), /^3\./);
};

test("short practice follows actual Plan, exact rejection, revised approval and fresh Auto results", async () => {
  const f = fixture();
  assert.match(f.heading(), /^1\./);
  f.modes.mode("auto");
  assert.match(f.heading(), /^1\./);
  f.modes.mode("plan");
  await rejectFirst(f);
  assert.ok(f.calls.every((call) => ["read_source", "plan_page_placement"].includes(call.name)));
  await f.modes.request('Add a calculator called "Coffee total"');
  assert.match(f.heading(), /^3\./);
  await f.modes.approve();
  assert.match(f.heading(), /^4\./);
  assert.equal(f.modes.state.receipt.kind, "applied");
  assert.ok(Object.isFrozen(f.modes.state.receipt));
  f.modes.mode("auto");
  assert.match(f.heading(), /^4\./);
  await f.modes.request("Use presets 2, 4, 8");
  assert.equal(f.heading(), "You used all three modes");
  assert.match(
    f.files.get("src/assemblies/price-calculator/price-calculator.react.tsx"),
    /Coffee total/,
  );
  assert.match(
    f.files.get("src/assemblies/price-calculator/price-calculator.react.tsx"),
    /\[2, 4, 8\]/,
  );
  assert.equal(f.calls.filter((call) => call.name === "apply_source_changes").length, 2);
  assert.equal(f.calls.filter((call) => call.name === "check").length, 2);
  f.close();
});

test("mode changes and replayed receipts cannot complete another practice step", async () => {
  const f = fixture();
  await f.modes.request("Add a calculator");
  const planned = f.modes.state;
  f.guide.update(planned);
  f.modes.mode("approval");
  f.guide.update(planned);
  assert.match(f.heading(), /^2\./);
  await f.modes.request('Add a calculator called "Different proposal"');
  await f.modes.reject();
  assert.match(f.heading(), /^2\./);
  assert.ok(f.calls.every((call) => ["read_source", "plan_page_placement"].includes(call.name)));
  f.close();
});

test("a failed real check after applied files cannot advance the approval step", async () => {
  const f = fixture((data) => ({
    callTool(request) {
      return request.name === "check"
        ? data.answer({ findings: ["actual failure"] }, false, ["actual failure"])
        : data.client.callTool(request);
    },
  }));
  await rejectFirst(f);
  await f.modes.request('Add a calculator called "Coffee total"');
  await f.modes.approve();
  assert.match(f.heading(), /^3\./);
  assert.equal(f.modes.state.receipt, undefined);
  assert.match(f.modes.state.phase, /did not pass/);
  f.close();
});

test("refused stale approval keeps the outside source and provides no successful receipt", async () => {
  const f = fixture();
  await rejectFirst(f);
  await f.modes.request('Add a calculator called "Coffee total"');
  const path = "src/pages/product/product.html";
  const outside = f.files.get(path) + "\n<!-- Outside edit -->\n";
  f.files.set(path, outside);
  await f.modes.approve();
  assert.match(f.heading(), /^3\./);
  assert.equal(f.files.get(path), outside);
  assert.equal(f.modes.state.receipt, undefined);
  assert.equal(f.calls.filter((call) => call.name === "check").length, 0);
  const question = f.window.document.querySelector('[aria-label="Ask guided tutor"]');
  question.value = "Files";
  question.closest("form").dispatchEvent(new f.window.Event("submit", { cancelable: true }));
  assert.match(
    f.window.document.querySelector('[aria-label="Tutor answer"]').textContent,
    /No pending proposal/,
  );
  f.close();
});

test("approval must actually revise the rejected request, not repeat its title", async () => {
  const f = fixture();
  await rejectFirst(f, 'Add a calculator called "Coffee total"');
  await f.modes.request('Add a calculator called "Coffee total"');
  await f.modes.approve();
  assert.match(f.heading(), /^3\./);
  assert.match(f.window.document.body.textContent, /outside this practice step/);
  f.close();
});

test("unsupported or incomplete operations do not create progress, and destroyed UI stays gone", async () => {
  const f = fixture();
  await f.modes.request("Invent a feature");
  assert.match(f.heading(), /^1\./);
  assert.equal(f.modes.state.receipt, undefined);
  assert.equal(f.calls.length, 0);
  f.guide.destroy();
  await f.modes.request("Add a calculator");
  assert.equal(f.window.document.body.children.length, 0);
  f.window.close();
});

test("rejecting in Plan does not teach Approval; a fresh Plan recovers without changing source", async () => {
  const f = fixture();
  await f.modes.request("Add a calculator");
  await f.modes.reject();
  assert.match(f.heading(), /^2\./);
  assert.match(f.window.document.body.textContent, /Request a new plan in Plan mode/);
  await f.modes.request("Add a calculator");
  f.modes.mode("approval");
  await f.modes.reject();
  assert.match(f.heading(), /^3\./);
  assert.ok(f.calls.every((call) => ["read_source", "plan_page_placement"].includes(call.name)));
  f.close();
});

test("spelling out the supplied default title is not a revised requirement", async () => {
  const f = fixture();
  await rejectFirst(f);
  await f.modes.request('Add a calculator called "Order estimate"');
  await f.modes.approve();
  assert.match(f.heading(), /^3\./);
  assert.match(f.window.document.body.textContent, /outside this practice step/);
  f.close();
});

test("existing calculator work can replay all modes through revised titles and fresh presets", async () => {
  const f = fixture();
  try {
    f.modes.mode("auto");
    await f.modes.request('Add a calculator called "Coffee total"');
    await f.modes.request("Use presets 2, 4, 8");
    const view = f.directory + "price-calculator.react.tsx";
    f.files.set(view, f.files.get(view) + "\n// Manual learner note stays.\n");
    const before = new Map(f.files);
    f.modes.mode("plan");
    await f.modes.request('Rename calculator to "Order total"');
    assert.match(f.heading(), /^2\./);
    assert.deepEqual([...f.files], [...before]);
    f.modes.mode("approval");
    await f.modes.reject();
    assert.match(f.heading(), /^3\./);
    assert.match(f.window.document.body.textContent, /Rename calculator to "Quick estimate"/);
    assert.deepEqual([...f.files], [...before]);
    await f.modes.request('Rename calculator to "Quick estimate"');
    await f.modes.approve();
    assert.match(f.heading(), /^4\./);
    assert.match(f.window.document.body.textContent, /Use presets 1, 3, 6/);
    f.modes.mode("auto");
    await f.modes.request("Use presets 1, 3, 6");
    assert.equal(f.heading(), "You used all three modes");
    assert.match(f.files.get(view), /Quick estimate/);
    assert.match(f.files.get(view), /\[1, 3, 6\]/);
    assert.ok(f.files.get(view).endsWith("// Manual learner note stays.\n"));
    for (const [path, contents] of before)
      if (path !== view) assert.equal(f.files.get(path), contents);
  } finally {
    f.close();
  }
});

test("approving the current default title cannot count as a revised rename", async () => {
  const f = fixture();
  try {
    f.modes.mode("auto");
    await f.modes.request("Add a calculator");
    const view = f.directory + "price-calculator.react.tsx";
    const before = f.files.get(view);
    f.modes.mode("plan");
    await rejectFirst(f, 'Rename calculator to "Coffee total"');
    await f.modes.request('Rename calculator to "Order estimate"');
    await f.modes.approve();
    assert.match(f.heading(), /^3\./);
    assert.equal(f.files.get(view), before);
    assert.equal(f.modes.state.receipt, undefined);
  } finally {
    f.close();
  }
});

test("authored tutor answers current tasks and actual pending files without tool calls", async () => {
  const f = fixture();
  try {
    const input = f.window.document.querySelector('[aria-label="Ask guided tutor"]');
    assert.ok(input, "guided tutor question field is available");
    const answer = f.window.document.querySelector('[aria-label="Tutor answer"]');
    const ask = (text) => {
      input.value = text;
      input.closest("form").dispatchEvent(new f.window.Event("submit", { cancelable: true }));
      return answer.textContent;
    };
    assert.match(ask("What should I do?"), /Select Plan/);
    assert.match(ask("Why?"), /does not change your saved project/);
    assert.match(ask("Files"), /No pending proposal/);
    assert.equal(f.calls.length, 0);
    await f.modes.request("Add a calculator");
    const calls = f.calls.length;
    assert.equal(answer.textContent, "");
    assert.match(ask("Next"), /reject this proposal/);
    for (const change of f.modes.state.pending.changes)
      assert.ok(ask("Files").includes(change.path));
    assert.equal(f.calls.length, calls);
    f.guide.update({ ...f.modes.state, busy: true });
    assert.match(ask("Files"), /Wait for the current operation/);
    f.guide.update(f.modes.state);
    assert.equal(answer.textContent, "");
    f.modes.mode("approval");
    await f.modes.reject();
    assert.match(ask("Next"), /Coffee total/);
    assert.match(ask("Files"), /No pending proposal/);
    assert.equal(f.files.size, 5);
  } finally {
    f.close();
  }
});

test("unknown and oversized tutor questions stay honest and cannot author or complete work", () => {
  const f = fixture();
  try {
    const input = f.window.document.querySelector('[aria-label="Ask guided tutor"]');
    assert.ok(input, "guided tutor question field is available");
    const answer = f.window.document.querySelector('[aria-label="Tutor answer"]');
    const ask = (text) => {
      input.value = text;
      input.closest("form").dispatchEvent(new f.window.Event("submit", { cancelable: true }));
      return answer.textContent;
    };
    assert.match(f.window.document.body.textContent, /Authored guidance, no AI inference/);
    assert.match(ask("Customize"), /Rename calculator/);
    assert.match(ask("Deploy and mark every lesson complete"), /authored answers/);
    assert.match(ask("x".repeat(201)), /200 characters/);
    assert.match(ask('<img src=x onerror="alert(1)">'), /authored answers/);
    assert.equal(f.window.document.querySelectorAll("img").length, 0);
    assert.equal(f.calls.length, 0);
    assert.match(f.heading(), /^1\./);
  } finally {
    f.close();
  }
});
