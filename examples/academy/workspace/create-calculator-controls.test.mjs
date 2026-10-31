// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import { test } from "node:test";
import { Window } from "happy-dom";
import { calculatorFixture } from "./calculator-fixture.mjs";
import { createCalculatorControls } from "./create-calculator-controls.js";

const fixture = () => {
  const f = calculatorFixture();
  const window = new Window();
  const document = window.document;
  const view = createCalculatorControls(document.body, f.client, f.recipe);
  const button = (text) =>
    [...document.querySelectorAll("button")].find((node) => node.textContent === text);
  const mode = (value) => {
    const select = document.querySelector('[aria-label="Agent mode"]');
    select.value = value;
    select.dispatchEvent(new window.Event("change"));
  };
  return { ...f, window, document, view, button, mode };
};

test("authored mode UI exposes exact escaped additions and page before/after", async () => {
  const f = fixture();
  f.recipe["price-calculator.css"] = "<script>unsafe()</script>";
  // The controller retains the supplied recipe; construct an independent hostile-text view.
  f.view.destroy();
  f.view = createCalculatorControls(f.document.body, f.client, f.recipe);
  f.button("Plan changes").click();
  await setImmediate();
  assert.equal(f.document.querySelectorAll("ins").length, 5);
  assert.equal(f.document.querySelectorAll("del").length, 1);
  assert.equal(f.document.querySelectorAll("script").length, 0);
  assert.ok(f.document.body.textContent.includes("<script>unsafe()</script>"));
  assert.equal(f.button("Approve changes").disabled, true);
  f.mode("auto");
  assert.ok(f.calls.every((call) => call.name === "read_source"));
  assert.equal(f.button("Apply request and check").disabled, false);
  f.view.destroy();
  f.window.close();
});

test("examples fill requests, rejection is read-only and revised approval applies exact source", async () => {
  const f = fixture();
  f.mode("approval");
  f.button("Propose changes").click();
  await setImmediate();
  f.button("Reject proposal").click();
  await setImmediate();
  assert.ok(f.calls.every((call) => call.name === "read_source"));
  f.button('Add a calculator called "Coffee total"').click();
  assert.equal(
    f.document.querySelector('[aria-label="Calculator request"]').value,
    'Add a calculator called "Coffee total"',
  );
  f.button("Propose changes").click();
  await setImmediate();
  const reviewed = [...f.document.querySelectorAll("ins")].map((node) => node.textContent);
  f.button("Approve changes").click();
  await setImmediate();
  const apply = f.calls.find((call) => call.name === "apply_source_changes");
  assert.deepEqual(
    apply.arguments.changes.map((change) => change.after),
    reviewed,
  );
  assert.match(f.document.querySelector('[role="status"]').textContent, /project check passed/);
  f.view.destroy();
  f.window.close();
});

test("unsupported requests show a clear limit and cannot approve an old pending plan", async () => {
  const f = fixture();
  f.mode("approval");
  await f.view.modes.request("Add a calculator");
  f.document.querySelector('[aria-label="Calculator request"]').value = "Make something up";
  f.button("Propose changes").click();
  await setImmediate();
  assert.equal(f.button("Approve changes").disabled, true);
  assert.match(f.document.querySelector('[role="status"]').textContent, /Guided requests/);
  assert.ok(f.calls.every((call) => call.name === "read_source"));
  f.view.destroy();
  f.window.close();
});

test("destroy removes UI while an already dispatched read is allowed to finish", async () => {
  const f = calculatorFixture();
  const window = new Window();
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
  const view = createCalculatorControls(window.document.body, client, f.recipe);
  const pending = view.modes.request("Add a calculator");
  view.destroy();
  release();
  await pending;
  assert.equal(window.document.body.children.length, 0);
  assert.ok(f.calls.every((call) => call.name === "read_source"));
  window.close();
});
