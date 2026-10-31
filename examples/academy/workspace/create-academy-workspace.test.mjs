// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import { test } from "node:test";
import { Window } from "happy-dom";
import { calculatorFixture } from "./calculator-fixture.mjs";
import { createAcademyWorkspace } from "./create-academy-workspace.js";

const fixture = async (clientOf = (f) => f.client) => {
  const f = calculatorFixture();
  const window = new Window({
    url: "https://academy.example/",
    settings: { navigation: { disableChildFrameNavigation: true } },
  });
  const document = window.document;
  const calls = [];
  const runtime = {
    origin: "https://preview.example",
    async rebuild() {
      calls.push("build");
      return "https://preview.example/p/kb-guji-250";
    },
    async stop() {
      calls.push("stop");
    },
  };
  const paths = [...f.files.keys()];
  const view = createAcademyWorkspace(document.body, clientOf(f), f.recipe, paths, runtime);
  await setImmediate();
  return {
    ...f,
    window,
    document,
    view,
    runtime,
    runtimeCalls: calls,
    close() {
      view.destroy();
      window.close();
    },
  };
};

test("check precedes the real runtime request, with a pinned framed URL and explicit stop", async () => {
  const f = await fixture();
  assert.equal(f.document.querySelector("iframe"), null);
  const result = await f.view.refresh();
  assert.equal(result.ok, true);
  assert.deepEqual(
    f.calls.slice(1).map((call) => call.name),
    ["read_source_version", "check", "read_source_version", "read_source_version"],
  );
  assert.match(result.version, /^[a-f0-9]{12}$/);
  assert.deepEqual(f.runtimeCalls, ["build"]);
  const frame = f.document.querySelector("iframe");
  assert.equal(frame.src, "https://preview.example/p/kb-guji-250");
  assert.equal(frame.getAttribute("srcdoc"), null);
  assert.equal(frame.getAttribute("sandbox"), "allow-scripts allow-same-origin allow-forms");
  assert.match(
    f.document.querySelector('[aria-label="Workspace status"]').textContent,
    /Preview requested/,
  );
  assert.equal((await f.view.stop()).ok, true);
  assert.equal(f.document.querySelector("iframe"), null);
  assert.deepEqual(f.runtimeCalls, ["build", "stop"]);
  assert.equal(f.files.get("src/pages/product/product.html"), f.page);
  f.close();
});

test("actual failed or malformed checks never request a build or preview", async () => {
  for (const result of [
    { ok: false, result: { findings: ["actual rule"] }, problems: ["actual rule"] },
    { ok: true, result: {}, problems: [] },
  ]) {
    const f = await fixture((data) => ({
      callTool: (request) =>
        request.name === "check"
          ? data.answer(result.result, result.ok, result.problems)
          : data.client.callTool(request),
    }));
    assert.equal((await f.view.refresh()).ok, false);
    assert.deepEqual(f.runtimeCalls, []);
    assert.equal(f.document.querySelector("iframe"), null);
    assert.match(
      f.document.querySelector('[aria-label="Workspace status"]').textContent,
      /check refused/,
    );
    f.close();
  }
});

test("preview rejects same-origin, unsafe, credentialed and mixed-content origins and redirected result URLs", async () => {
  const window = new Window({
    url: "https://academy.example/",
    settings: { navigation: { disableChildFrameNavigation: true } },
  });
  const f = calculatorFixture();
  const paths = ["src/pages/product/product.html"];
  for (const origin of [
    "https://academy.example",
    "javascript:alert(1)",
    "https://user:pass@preview.example",
    "http://preview.example",
    "https://preview.example/path",
  ]) {
    assert.throws(() =>
      createAcademyWorkspace(window.document.body, f.client, f.recipe, paths, {
        origin,
        rebuild() {},
        stop() {},
      }),
    );
    assert.equal(window.document.body.children.length, 0);
  }
  window.close();
  const data = await fixture();
  data.runtime.rebuild = async () => "https://other.example/p/product";
  assert.equal((await data.view.refresh()).ok, false);
  assert.equal(data.document.querySelector("iframe"), null);
  data.close();
});

test("guided writes invalidate preview and refresh clean opened source through the same client", async () => {
  const f = await fixture();
  await f.view.refresh();
  f.view.tutor.modes.mode("approval");
  await f.view.tutor.modes.request('Add a calculator called "Coffee total"');
  assert.ok(f.document.querySelector("iframe"));
  await f.view.tutor.modes.approve();
  assert.equal(f.document.querySelector("iframe"), null);
  assert.equal(
    f.document.querySelector("textarea").value,
    f.files.get("src/pages/product/product.html"),
  );
  assert.match(f.document.querySelector("textarea").value, /price-calculator/);
  assert.ok(
    [...f.document.querySelectorAll('nav[aria-label="Project files"] button')].some(
      (button) => button.textContent === f.directory + "price-calculator.react.tsx",
    ),
  );
  await f.view.editor.open(f.directory + "price-calculator.react.tsx");
  assert.equal(
    f.document.querySelector("textarea").value,
    f.files.get(f.directory + "price-calculator.react.tsx"),
  );
  assert.deepEqual(f.runtimeCalls, ["build"]);
  await f.view.refresh();
  assert.deepEqual(f.runtimeCalls, ["build", "build"]);
  f.close();
});

test("a dirty source draft survives an agent change and its stale save is refused", async () => {
  const f = await fixture();
  const input = f.document.querySelector("textarea");
  const draft = input.value + "\n<!-- Learner draft -->\n";
  input.value = draft;
  input.dispatchEvent(new f.window.Event("input"));
  f.view.tutor.modes.mode("auto");
  await f.view.tutor.modes.request("Add a calculator");
  assert.equal(input.value, draft);
  assert.equal(f.view.editor.files.buffer("src/pages/product/product.html").dirty, true);
  await assert.rejects(
    f.view.editor.files.save("src/pages/product/product.html"),
    /source changed/,
  );
  assert.equal(input.value, draft);
  assert.match(f.files.get("src/pages/product/product.html"), /price-calculator/);
  f.close();
});

test("preview operations serialize their own source writes while a build is pending", async () => {
  const f = await fixture();
  let release;
  f.runtime.rebuild = () =>
    new Promise((resolve) => {
      release = resolve;
    });
  const building = f.view.refresh();
  await setImmediate();
  assert.equal(
    f.document.querySelector('fieldset[aria-label="Source editing controls"]').disabled,
    true,
  );
  assert.equal((await f.view.refresh()).ok, false);
  f.view.tutor.modes.mode("auto");
  await f.view.tutor.modes.request("Add a calculator");
  assert.ok(f.calls.every((call) => call.name !== "apply_source_changes"));
  assert.match(f.view.tutor.modes.state.phase, /wait for the preview operation/);
  release("https://preview.example/p/product");
  await building;
  f.close();
});

test("destroy prevents a late runtime result from mounting a frame and leaves shutdown to its owner", async () => {
  const f = await fixture();
  let release;
  f.runtime.rebuild = () =>
    new Promise((resolve) => {
      release = resolve;
    });
  const building = f.view.refresh();
  await setImmediate();
  f.view.destroy();
  release("https://preview.example/p/product");
  await building;
  assert.equal(f.document.body.children.length, 0);
  assert.deepEqual(f.runtimeCalls, []);
  f.window.close();
});

test("an outside source change during check refuses preview before building and keeps the edit", async () => {
  const path = "src/pages/product/product.html";
  const f = await fixture((data) => ({
    async callTool(request) {
      const answer = await data.client.callTool(request);
      if (request.name === "check") data.files.set(path, data.files.get(path) + "<!-- outside -->");
      return answer;
    },
  }));
  try {
    assert.equal((await f.view.refresh()).ok, false);
    assert.deepEqual(f.runtimeCalls, []);
    assert.equal(f.document.querySelector("iframe"), null);
    assert.match(f.files.get(path), /outside/);
  } finally {
    f.close();
  }
});

test("an outside source change during build refuses the frame and keeps stop available", async () => {
  const f = await fixture();
  f.runtime.rebuild = async () => {
    const path = "src/pages/product/product.html";
    f.files.set(path, f.files.get(path) + "<!-- outside build -->");
    return "https://preview.example/p/product";
  };
  try {
    assert.equal((await f.view.refresh()).ok, false);
    assert.equal(f.document.querySelector("iframe"), null);
    assert.equal(f.document.querySelector("button").disabled, false);
    assert.equal((await f.view.stop()).ok, true);
    assert.deepEqual(f.runtimeCalls, ["stop"]);
    assert.match(f.files.get("src/pages/product/product.html"), /outside build/);
  } finally {
    f.close();
  }
});

test("failed or malformed source identities never claim preview readiness", async () => {
  for (const version of [null, 123456789012, "ABCDEF123456", "", "too-short"]) {
    const f = await fixture((data) => ({
      callTool: (request) =>
        request.name === "read_source_version"
          ? data.answer({ version })
          : data.client.callTool(request),
    }));
    try {
      assert.equal((await f.view.refresh()).ok, false);
      assert.deepEqual(f.runtimeCalls, []);
      assert.equal(f.document.querySelector("iframe"), null);
      assert.match(
        f.document.querySelector(".academy-application-preview details pre").textContent,
        /source version unavailable/,
      );
    } finally {
      f.close();
    }
  }
});

test("destroy during source identity reading dispatches no later check or build", async () => {
  let release;
  const f = await fixture((data) => ({
    callTool: (request) =>
      request.name === "read_source_version"
        ? new Promise((resolve) => {
            release = () => resolve(data.answer({ version: "abcdef123456" }));
          })
        : data.client.callTool(request),
  }));
  const pending = f.view.refresh();
  await setImmediate();
  f.view.destroy();
  release();
  assert.equal((await pending).ok, false);
  assert.equal(
    f.calls.some((call) => call.name === "check"),
    false,
  );
  assert.deepEqual(f.runtimeCalls, []);
  f.window.close();
});
