// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { Window } from "happy-dom";
import { createModeWalkthrough } from "./create-mode-walkthrough.js";
import { explainProjectCheck } from "./explain-project-check.js";

const version = "a".repeat(12);
const finding = {
  path: "src/assemblies/photo/photo.html",
  rule: "an-image-has-an-alternative",
  message: "Image has no alternative.",
  fix: "Give the image an alt attribute.",
};
const rule = {
  id: finding.rule,
  rule: "An image has an alternative.",
  because: "An image needs equivalent text.",
  smell: "An img without alt.",
};
const reply = (result, ok = true, problems = []) => ({
  content: [{ type: "text", text: JSON.stringify({ ok, result, problems }) }],
});
const fixture = (options = {}) => {
  const calls = [];
  let reads = 0;
  const client = {
    async callTool(request) {
      calls.push(request);
      if (options.call) return options.call(request, calls);
      if (request.name === "read_source_version")
        return reply({ version: ++reads > 1 ? (options.after ?? version) : version });
      if (request.name === "check")
        return options.check ?? reply({ findings: [finding] }, false, [finding]);
      if (request.name === "explain") return options.explain ?? reply(rule);
      throw new Error("unexpected authoring call");
    },
  };
  return { calls, client };
};
const settle = () => new Promise(setImmediate);
const ui = (client) => {
  const window = new Window();
  const guide = createModeWalkthrough(window.document.body, client);
  const input = window.document.querySelector('[aria-label="Ask guided tutor"]');
  const answer = () => window.document.querySelector('[aria-label="Tutor answer"]').textContent;
  return {
    window,
    guide,
    answer,
    ask(text) {
      input.value = text;
      input.closest("form").dispatchEvent(new window.Event("submit", { cancelable: true }));
    },
    close() {
      guide.destroy();
      window.close();
    },
  };
};

test("real finding fields select only their authored rule explanation", async () => {
  const f = fixture();
  const text = await explainProjectCheck(f.client, () => true);
  assert.match(text, new RegExp(version));
  assert.ok(
    text.includes(finding.path) && text.includes(finding.message) && text.includes(finding.fix),
  );
  assert.ok(text.includes(rule.because));
  assert.deepEqual(
    f.calls.map((call) => call.name),
    ["read_source_version", "check", "explain", "read_source_version"],
  );
  assert.deepEqual(f.calls[2].arguments, { id: finding.rule });
});

test("a passing check reports only observed source, with no explanation or completion claim", async () => {
  const f = fixture({ check: reply({ findings: [] }) });
  const text = await explainProjectCheck(f.client, () => true);
  assert.match(text, /passed at observed revision/);
  assert.match(text, /Preview and lesson completion are not verified/);
  assert.deepEqual(
    f.calls.map((call) => call.name),
    ["read_source_version", "check", "read_source_version"],
  );
});

for (const [name, checked] of [
  ["missing findings", reply({})],
  ["contradictory success", reply({ findings: [finding] })],
  ["failed empty result", reply({ findings: [] }, false)],
  ["missing problem", reply({ findings: [finding] }, false)],
  ["malformed finding", reply({ findings: [{ ...finding, rule: 3 }] }, false, [finding])],
])
  test(`check guidance refuses ${name}`, async () => {
    const f = fixture({ check: checked });
    assert.match(await explainProjectCheck(f.client, () => true), /could not be confirmed/);
    assert.equal(f.calls.length, 2);
  });

for (const [name, explanation] of [
  ["unknown rule", reply(null, false, ["untrusted details"])],
  ["wrong rule identity", reply({ ...rule, id: "another-rule", because: "PRIVATE_SENTINEL" })],
  ["malformed explanation", reply({ id: finding.rule, because: "PRIVATE_SENTINEL" })],
  ["contradictory explanation", reply({ ...rule, because: "PRIVATE_SENTINEL" }, true, ["failure"])],
  ["remote error", { isError: true, content: [{ type: "text", text: "PRIVATE_SENTINEL" }] }],
])
  test(`actual finding survives ${name}`, async () => {
    const f = fixture({ explain: explanation });
    const text = await explainProjectCheck(f.client, () => true);
    assert.ok(text.includes(finding.message) && text.includes(finding.fix));
    assert.match(text, /No authored explanation was confirmed/);
    assert.doesNotMatch(text, /PRIVATE_SENTINEL|untrusted details/);
  });

test("changed source invalidates guidance rather than reporting an old check", async () => {
  const f = fixture({ after: "b".repeat(12) });
  const text = await explainProjectCheck(f.client, () => true);
  assert.match(text, /Saved source changed/);
  assert.ok(!text.includes(rule.because));
});

test("superseded requests stop before requesting more tools", async () => {
  let current = true;
  const f = fixture({
    call(_request) {
      current = false;
      return reply({ version });
    },
  });
  assert.equal(await explainProjectCheck(f.client, () => current), "");
  assert.equal(f.calls.length, 1);
  assert.equal(await explainProjectCheck(f.client, () => false), "");
  assert.equal(f.calls.length, 1);
});

test("unreadable source and failed transport use a fixed safe error", async () => {
  for (const call of [
    () => reply({ version: "PRIVATE_SENTINEL" }),
    () => {
      throw new Error("PRIVATE_SENTINEL");
    },
  ]) {
    const f = fixture({ call });
    const text = await explainProjectCheck(f.client, () => true);
    assert.match(text, /could not be confirmed/);
    assert.doesNotMatch(text, /PRIVATE_SENTINEL/);
  }
});

test("long diagnostics are visibly shortened and only the first finding is explained", async () => {
  const long = {
    ...finding,
    path: "p".repeat(10000),
    message: "m".repeat(10000),
    fix: "f".repeat(10000),
  };
  const f = fixture({
    check: reply({ findings: [long, finding] }, false, [long, finding]),
    explain: reply({ ...rule, because: "b".repeat(10000) }),
  });
  const text = await explainProjectCheck(f.client, () => true);
  assert.match(text, /2 findings\. First:/);
  assert.ok(text.length < 1400 && text.includes("..."));
  assert.equal(f.calls.filter((call) => call.name === "explain").length, 1);
});

test("the new question is read-only, renders text, and cannot advance practice", async () => {
  const hostile = { ...finding, message: '<img src=x onerror="bad()">' };
  const f = fixture({ check: reply({ findings: [hostile] }, false, [hostile]) });
  const view = ui(f.client);
  try {
    view.ask("Check and explain");
    view.ask("Explain check");
    assert.match(view.answer(), /still pending/);
    await settle();
    assert.ok(view.answer().includes(hostile.message));
    assert.equal(view.window.document.querySelectorAll("img").length, 0);
    assert.equal(view.window.document.querySelector("h2").textContent, "1. Plan without writing");
    assert.deepEqual(
      f.calls.map((call) => call.name),
      ["read_source_version", "check", "explain", "read_source_version"],
    );
  } finally {
    view.close();
  }
});

for (const action of ["question", "state", "destroy"])
  test(`a late check cannot overwrite after ${action}`, async () => {
    let resolve;
    const f = fixture({
      call() {
        return new Promise((done) => {
          resolve = done;
        });
      },
    });
    const view = ui(f.client);
    try {
      view.ask("Check and explain");
      if (action === "question") view.ask("Why");
      if (action === "state") view.guide.update({ busy: false });
      if (action === "destroy") view.guide.destroy();
      const before = action === "destroy" ? view.window.document.body.textContent : view.answer();
      resolve(reply({ version }));
      await settle();
      assert.equal(
        action === "destroy" ? view.window.document.body.textContent : view.answer(),
        before,
      );
      assert.equal(f.calls.length, 1);
    } finally {
      view.close();
    }
  });

test("guidance deadline releases its pending state and ignores the late source reply", async () => {
  let resolve;
  const f = fixture({
    call() {
      return new Promise((done) => {
        resolve = done;
      });
    },
  });
  const view = ui(f.client);
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
    view.ask("Check and explain");
    assert.equal(typeof expire, "function");
    expire();
    assert.match(view.answer(), /timed out/);
    resolve(reply({ version }));
    await settle();
    assert.match(view.answer(), /timed out/);
    assert.equal(f.calls.length, 1);
    view.ask("Next");
    assert.match(view.answer(), /Select Plan/);
  } finally {
    view.close();
    globalThis.setTimeout = originalSet;
    globalThis.clearTimeout = originalClear;
  }
});
