// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { calculatorFixture } from "./calculator-fixture.mjs";
import { calculatorPlan } from "./calculator-plan.js";
import { calculatorRequest } from "./calculator-request.js";

test("authored requests accept bounded supported settings and refuse unrelated prose", () => {
  assert.deepEqual(calculatorRequest(" Add a calculator! "), { action: "add" });
  assert.deepEqual(calculatorRequest('Rename the calculator to "Tea & coffee"'), {
    action: "title",
    title: "Tea & coffee",
  });
  assert.deepEqual(calculatorRequest("Use presets 2, 4, 8"), {
    action: "presets",
    values: [2, 4, 8],
  });
  for (const text of [
    null,
    "x".repeat(201),
    "Build a payment server",
    "Use presets 0, 100",
    "Use presets 1, 1",
    "Use presets 1 3 6",
    'Rename calculator to ""',
    'Rename calculator to "bad\nlabel"',
    'Call calculator "bad\u0000label"',
    'Call calculator "bad\u2028label"',
    'Call calculator "bad\uD800label"',
  ])
    assert.throws(() => calculatorRequest(text));
});

test("add proposes the four real calculator files and exact existing-page placement without writing", async () => {
  const fixture = calculatorFixture();
  const before = [...fixture.files];
  const plan = await calculatorPlan(fixture.client, fixture.recipe, "Add a calculator");
  assert.equal(plan.changes.length, 5);
  for (const change of plan.changes.slice(0, 4)) {
    assert.equal(change.before, null);
    assert.equal(change.after, fixture.recipe[change.path.slice(fixture.directory.length)]);
  }
  const page = plan.changes[4];
  assert.equal(page.before, fixture.page);
  assert.equal(
    page.after,
    fixture.page.replace(
      '<assembly name="buy-box"></assembly>',
      '<assembly name="buy-box"></assembly>\n          <assembly name="price-calculator"></assembly>',
    ),
  );
  assert.deepEqual([...fixture.files], before);
  assert.ok(
    fixture.calls.every((call) => ["read_source", "plan_page_placement"].includes(call.name)),
  );
  assert.ok(Object.isFrozen(plan.changes) && plan.changes.every(Object.isFrozen));
});

test("existing files, missing dependencies and ambiguous placement stop before writes", async () => {
  for (const modify of [
    (f) => f.files.set(f.directory + "price-calculator.css", "manual"),
    (f) => f.files.delete("src/api/quote.api.ts"),
    (f) => f.files.set("src/pages/product/product.html", f.page + f.page),
    (f) =>
      f.files.set(
        "src/pages/product/product.html",
        '<assembly name="price-calculator"></assembly>',
      ),
    (f) => f.files.set("src/pages/product/product.html", "manual page"),
    (f) => {
      delete f.recipe["request-estimate.ts"];
    },
  ]) {
    const f = calculatorFixture();
    modify(f);
    const before = [...f.files];
    await assert.rejects(calculatorPlan(f.client, f.recipe, "Add a calculator"));
    assert.deepEqual([...f.files], before);
    assert.ok(f.calls.every((call) => ["read_source", "plan_page_placement"].includes(call.name)));
  }
});

test("storage failures and malformed read replies never imply an absent file", async () => {
  for (const answer of [
    { ok: false, result: null, problems: ["denied"] },
    { ok: true, result: { path: "wrong", contents: "x" }, problems: [] },
    { ok: true, result: { path: "src/api/quote.api.ts", contents: 1 }, problems: [] },
  ]) {
    const client = {
      callTool: async () => ({ content: [{ type: "text", text: JSON.stringify(answer) }] }),
    };
    await assert.rejects(calculatorPlan(client, {}, "Add a calculator"));
  }
});

test("supported customizations preserve unrelated manual code and can be revised repeatedly", async () => {
  const f = calculatorFixture();
  const path = f.directory + "price-calculator.react.tsx";
  f.files.set(path, f.recipe["price-calculator.react.tsx"] + "\n// Manual note stays.\n");
  for (const request of [
    'Call calculator "Tea <coffee> & {milk}"',
    'Rename calculator to "Second title"',
    "Set quantity presets to 2, 4, 8",
  ]) {
    const before = f.files.get(path);
    const plan = await calculatorPlan(f.client, f.recipe, request);
    assert.equal(plan.changes.length, 1);
    assert.equal(plan.changes[0].before, before);
    assert.ok(plan.changes[0].after.endsWith("// Manual note stays.\n"));
    f.files.set(path, plan.changes[0].after);
  }
  assert.match(f.files.get(path), /<h2>\{"Second title"\}<\/h2>/);
  assert.match(f.files.get(path), /\[2, 4, 8\]\.map/);
  await assert.rejects(
    calculatorPlan(f.client, f.recipe, "Use presets 2, 4, 8"),
    /already matches/,
  );
});

test("customization refuses missing or unfamiliar source rather than replacing it with a recipe", async () => {
  const f = calculatorFixture();
  const path = f.directory + "price-calculator.react.tsx";
  await assert.rejects(
    calculatorPlan(f.client, f.recipe, 'Call calculator "Title"'),
    /before customizing/,
  );
  f.files.set(path, "unrelated manual component");
  for (const request of ['Call calculator "Title"', "Use presets 2, 4"])
    await assert.rejects(calculatorPlan(f.client, f.recipe, request), /changed shape/);
  assert.equal(f.files.get(path), "unrelated manual component");
});

test("a revised addition can name its title before approval without mutating recipe files", async () => {
  const f = calculatorFixture();
  const original = f.recipe["price-calculator.react.tsx"];
  const plan = await calculatorPlan(f.client, f.recipe, 'Add a calculator called "Coffee total"');
  assert.match(plan.changes[0].after, /<h2>\{"Coffee total"\}<\/h2>/);
  assert.equal(f.recipe["price-calculator.react.tsx"], original);
  assert.equal(f.files.has(f.directory + "price-calculator.react.tsx"), false);
});

test("a title marker in a manual comment cannot stand in for the actual heading", async () => {
  const f = calculatorFixture();
  f.files.set(
    f.directory + "price-calculator.react.tsx",
    f.recipe["price-calculator.react.tsx"].replace(
      "<h2>Order estimate</h2>",
      "<h2>Manual heading</h2>",
    ) + "\n// <h2>Order estimate</h2>\n",
  );
  await assert.rejects(calculatorPlan(f.client, f.recipe, 'Call calculator "New title"'));
});

test("a shared placement refusal is reported without writing", async () => {
  const f = calculatorFixture();
  const before = [...f.files];
  const call = f.client.callTool.bind(f.client);
  f.client.callTool = (request) =>
    request.name === "plan_page_placement"
      ? f.answer(null, false, ["no live buy-box placement"])
      : call(request);
  await assert.rejects(calculatorPlan(f.client, f.recipe, "Add a calculator"), /no live buy-box/);
  assert.deepEqual([...f.files], before);
});

test("a preset marker in a comment cannot replace an unrelated manual expression", async () => {
  const f = calculatorFixture();
  f.files.set(
    f.directory + "price-calculator.react.tsx",
    f.recipe["price-calculator.react.tsx"].replace(
      "{[1, 3, 6].map((value) => (",
      "{quantities.map((value) => (",
    ) + "\n// {[1, 3, 6].map((value) => (\n",
  );
  await assert.rejects(calculatorPlan(f.client, f.recipe, "Use presets 2, 4, 8"));
});

test("a manual page edit survives the proposed calculator placement", async () => {
  const f = calculatorFixture();
  const path = "src/pages/product/product.html";
  const manual = f.page.replace(
    '<main class="page">',
    '<main class="page">\n      <p>My shop introduction.</p>',
  );
  f.files.set(path, manual);
  const before = [...f.files];
  const plan = await calculatorPlan(f.client, f.recipe, "Add a calculator");
  assert.equal(plan.changes[4].before, manual);
  assert.match(plan.changes[4].after, /My shop introduction/);
  assert.match(plan.changes[4].after, /name="price-calculator"/);
  assert.deepEqual([...f.files], before);
});

test("malformed or repeated placement acknowledgements never authorize writes", async () => {
  for (const result of [
    null,
    { placed: "1" },
    { placed: 0 },
    {
      placed: 2,
      change: { path: "src/pages/product/product.html", before: "a", after: "b" },
    },
    { placed: 1, change: { path: "wrong", before: "a", after: "b" } },
    { placed: 1, change: { path: "src/pages/product/product.html", before: "a", after: "a" } },
  ]) {
    const f = calculatorFixture();
    const before = [...f.files];
    const call = f.client.callTool.bind(f.client);
    f.client.callTool = (request) =>
      request.name === "plan_page_placement" ? f.answer(result) : call(request);
    await assert.rejects(calculatorPlan(f.client, f.recipe, "Add a calculator"));
    assert.deepEqual([...f.files], before);
  }
});
