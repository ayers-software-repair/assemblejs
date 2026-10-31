// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import { test } from "node:test";
import { Window } from "happy-dom";
import { calculatorFixture } from "./calculator-fixture.mjs";
import { readProjectVersion } from "./read-project-version.js";
import { verifyCalculator } from "./verify-calculator.js";

const fixture = async () => {
  const f = calculatorFixture();
  const path = f.directory + "price-calculator.react.tsx";
  f.files.set(path, f.recipe["price-calculator.react.tsx"]);
  const version = await readProjectVersion(f.client);
  f.calls.length = 0;
  const window = new Window();
  const abort = new AbortController();
  const preview = { version, url: "https://preview.example/p/kb-guji-250" };
  const inspected = [];
  const runtime = {
    async inspect(values) {
      inspected.push([...values]);
      return {
        url: preview.url,
        html:
          '<assembly-root data-name="price-calculator"><section aria-label="Order estimate"><h2>Order estimate</h2><div aria-label="Quantity presets">' +
          values
            .map(
              (value) =>
                `<button type="button">${value} ${value === 1 ? "item" : "items"}</button>`,
            )
            .join("") +
          "</div></section></assembly-root>",
        quotes: values.map((quantity) => ({
          quantity,
          status: 200,
          body: {
            lines: [{ sku: "kb-guji-250", quantity, cents: 1600 }],
            cents: 1600 * quantity,
            problems: [],
          },
        })),
      };
    },
  };
  return {
    ...f,
    path,
    window,
    abort,
    preview,
    runtime,
    inspected,
    verify: (client = f.client) =>
      verifyCalculator(window.document, client, f.recipe, runtime, preview, abort.signal),
    close() {
      abort.abort();
      window.close();
    },
  };
};

test("current output check reuses the successful preview revision without check/build/write", async () => {
  const f = await fixture();
  try {
    const result = await f.verify();
    assert.equal(result.version, f.preview.version);
    assert.equal(result.title, "Order estimate");
    assert.deepEqual(f.inspected, [[1, 3, 6]]);
    assert.deepEqual(
      f.calls.map((call) => call.name),
      ["read_source_version", "read_source", "read_source_version"],
    );
  } finally {
    f.close();
  }
});

test("stale preview refuses before inspection and preserves the changed source", async () => {
  const f = await fixture();
  try {
    const changed = f.files.get(f.path) + "\n// Outside edit.\n";
    f.files.set(f.path, changed);
    await assert.rejects(f.verify(), /no longer matches/);
    assert.deepEqual(f.inspected, []);
    assert.equal(f.files.get(f.path), changed);
    assert.deepEqual(
      f.calls.map((call) => call.name),
      ["read_source_version"],
    );
  } finally {
    f.close();
  }
});

test("source change during inspection cannot receive a successful current result", async () => {
  const f = await fixture();
  try {
    const inspect = f.runtime.inspect;
    f.runtime.inspect = async (values) => {
      const result = await inspect(values);
      f.files.set(f.path, f.files.get(f.path) + "\n// Changed during inspection.\n");
      return result;
    };
    await assert.rejects(f.verify(), /no longer matches/);
    assert.match(f.files.get(f.path), /Changed during inspection/);
    assert.ok(f.calls.every((call) => call.name !== "apply_source_changes"));
  } finally {
    f.close();
  }
});

test("missing inspector, wrong preview identity and unfamiliar source fail closed", async () => {
  const f = await fixture();
  try {
    const inspect = f.runtime.inspect;
    f.runtime.inspect = undefined;
    await assert.rejects(f.verify(), /inspect actual/);
    assert.equal(f.calls.length, 0);
    f.runtime.inspect = async (values) => ({
      ...(await inspect(values)),
      url: "https://another.example/",
    });
    await assert.rejects(f.verify(), /preview URL/);
    f.runtime.inspect = inspect;
    f.files.set(f.path, f.files.get(f.path).replace("Get estimate", "Unknown manual layout"));
    f.preview.version = await readProjectVersion(f.client);
    const before = f.inspected.length;
    await assert.rejects(f.verify(), /unfamiliar manual code/);
    assert.equal(f.inspected.length, before);
  } finally {
    f.close();
  }
});

test("closing during identity reading dispatches no later reads or inspection", async () => {
  const f = await fixture();
  try {
    let release;
    const client = {
      callTool: () =>
        new Promise((resolve) => {
          release = () => resolve(f.answer({ version: f.preview.version }));
        }),
    };
    const pending = f.verify(client);
    await setImmediate();
    f.abort.abort();
    release();
    await assert.rejects(pending, /abort/i);
    assert.equal(f.calls.length, 0);
    assert.deepEqual(f.inspected, []);
  } finally {
    f.close();
  }
});

test("closing during inspection dispatches no later version read or success", async () => {
  const f = await fixture();
  try {
    const inspect = f.runtime.inspect;
    let release;
    f.runtime.inspect = (values) =>
      new Promise((resolve) => {
        release = async () => resolve(await inspect(values));
      });
    const pending = f.verify();
    await setImmediate();
    f.abort.abort();
    await release();
    await assert.rejects(pending, /abort/i);
    assert.deepEqual(
      f.calls.map((call) => call.name),
      ["read_source_version", "read_source"],
    );
  } finally {
    f.close();
  }
});

test("abort at either version-check await boundary dispatches no later reads or success", async () => {
  for (const cancelAt of [1, 2]) {
    const f = await fixture();
    try {
      let versions = 0;
      let callsAtAbort;
      f.abort.signal.addEventListener(
        "abort",
        () => {
          callsAtAbort = f.calls.map((call) => call.name);
        },
        { once: true },
      );
      const client = {
        callTool(request) {
          const reply = f.client.callTool(request);
          if (request.name === "read_source_version" && ++versions === cancelAt) {
            const schedule = (left) =>
              queueMicrotask(() => (left ? schedule(left - 1) : f.abort.abort()));
            schedule(3);
          }
          return reply;
        },
      };
      await assert.rejects(f.verify(client), /abort/i);
      assert.deepEqual(
        f.calls.map((call) => call.name),
        callsAtAbort,
      );
    } finally {
      f.close();
    }
  }
});
