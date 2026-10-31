// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { CalculatorModes } from "./calculator-modes.js";
import { calculatorFixture } from "./calculator-fixture.mjs";

test("Plan, mode changes and rejection never write; revised approval applies exact retained files", async () => {
  const f = calculatorFixture();
  const modes = new CalculatorModes(f.client, f.recipe);
  const before = [...f.files];
  await modes.request("Add a calculator");
  const first = modes.state.pending;
  assert.equal(first.changes.length, 5);
  modes.mode("auto");
  assert.deepEqual([...f.files], before);
  modes.mode("approval");
  await modes.reject();
  assert.equal(modes.state.pending, undefined);
  assert.deepEqual([...f.files], before);
  await modes.request('Add a calculator called "Coffee total"');
  const revised = modes.state.pending;
  assert.notEqual(revised.changes[0].after, first.changes[0].after);
  await modes.approve();
  for (const change of revised.changes) assert.equal(f.files.get(change.path), change.after);
  assert.equal(modes.state.pending, undefined);
  assert.equal(modes.state.check.ok, true);
  assert.match(modes.state.phase, /Build and live preview still require verification/);
  assert.deepEqual(
    f.calls.filter((call) => call.name !== "read_source").map((call) => call.name),
    ["apply_source_changes", "check"],
  );
});

test("Auto makes a fresh request and checks supported existing-file customization", async () => {
  const f = calculatorFixture();
  const modes = new CalculatorModes(f.client, f.recipe);
  await modes.request("Add a calculator");
  modes.mode("auto");
  assert.equal(f.files.has(f.directory + "price-calculator.react.tsx"), false);
  await modes.request('Add a calculator called "First title"');
  const path = f.directory + "price-calculator.react.tsx";
  f.files.set(path, f.files.get(path) + "\n// CLI change kept.\n");
  await modes.request("Use presets 2, 4, 8");
  assert.match(f.files.get(path), /\[2, 4, 8\]\.map/);
  assert.ok(f.files.get(path).endsWith("// CLI change kept.\n"));
  assert.equal(f.calls.filter((call) => call.name === "check").length, 2);
});

test("outside edits refuse the entire reviewed batch and consume apply permission", async () => {
  const f = calculatorFixture();
  const modes = new CalculatorModes(f.client, f.recipe);
  modes.mode("approval");
  await modes.request("Add a calculator");
  f.files.set("src/pages/product/product.html", "manual page");
  await modes.approve();
  assert.equal(modes.state.pending, undefined);
  assert.equal(modes.state.result.ok, false);
  assert.equal(modes.state.check, undefined);
  assert.equal(f.files.has(f.directory + "price-calculator.react.tsx"), false);
  assert.equal(f.files.get("src/pages/product/product.html"), "manual page");
  const applied = f.calls.filter((call) => call.name === "apply_source_changes").length;
  await modes.approve();
  assert.equal(f.calls.filter((call) => call.name === "apply_source_changes").length, applied);
});

test("a failed new request invalidates an older plan instead of approving another request", async () => {
  const f = calculatorFixture();
  const modes = new CalculatorModes(f.client, f.recipe);
  modes.mode("approval");
  await modes.request("Add a calculator");
  await modes.request("Invent a checkout system");
  assert.equal(modes.state.pending, undefined);
  await modes.approve();
  assert.ok(f.calls.every((call) => call.name === "read_source"));
});

test("lost, partial and malformed acknowledgements consume permission and never claim check success", async () => {
  for (const apply of [
    async () => {
      throw new Error("response lost");
    },
    async (f) =>
      f.answer({ written: ["src/a.ts"], attempted: ["src/a.ts"] }, false, ["partial disk failure"]),
    async (f) => f.answer({ written: [] }),
    async (f) => f.answer({ written: ["wrong"] }),
  ]) {
    const f = calculatorFixture();
    const client = {
      callTool: (request) =>
        request.name === "apply_source_changes" ? apply(f) : f.client.callTool(request),
    };
    const modes = new CalculatorModes(client, f.recipe);
    modes.mode("approval");
    await modes.request("Add a calculator");
    await modes.approve();
    assert.equal(modes.state.pending, undefined);
    assert.equal(modes.state.check, undefined);
    assert.doesNotMatch(modes.state.phase, /check passed/);
    if (modes.state.result?.ok === false)
      assert.match(JSON.stringify(modes.state.result), /partial disk failure/);
  }
});

test("failed or malformed checks report actual diagnostics without rolling back applied source", async () => {
  for (const result of [
    { ok: false, result: { findings: ["real rule"] }, problems: ["real rule"] },
    { ok: true, result: {}, problems: [] },
    { ok: true, result: { findings: ["rule"] }, problems: [] },
  ]) {
    const f = calculatorFixture();
    const client = {
      callTool: async (request) =>
        request.name === "check"
          ? f.answer(result.result, result.ok, result.problems)
          : f.client.callTool(request),
    };
    const modes = new CalculatorModes(client, f.recipe);
    modes.mode("auto");
    await modes.request("Add a calculator");
    assert.ok(f.files.has(f.directory + "price-calculator.react.tsx"));
    assert.doesNotMatch(modes.state.phase, /check passed/);
    assert.deepEqual(modes.state.check, result);
  }
});

test("in-flight planning blocks concurrent operations and mode changes", async () => {
  const f = calculatorFixture();
  let release;
  const wait = new Promise((resolve) => {
    release = resolve;
  });
  const client = {
    callTool: async (request) => {
      await wait;
      return f.client.callTool(request);
    },
  };
  const modes = new CalculatorModes(client, f.recipe);
  const planning = modes.request("Add a calculator");
  assert.throws(() => modes.mode("auto"), /wait/);
  await assert.rejects(modes.request("Add a calculator"), /wait/);
  release();
  await planning;
  assert.equal(modes.state.busy, false);
  await assert.rejects(modes.approve(), /Approval mode/);
});
