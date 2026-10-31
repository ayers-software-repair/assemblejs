// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { inspectMarketCalculator } from "./inspect-market-calculator.mjs";

const signal = () => new AbortController().signal;
test("inspector reads only the actual pinned page and requested non-mutating quote quantities", async () => {
  const calls = [];
  const fetch = mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    return new Response(
      url.endsWith("/api/quote")
        ? JSON.stringify({ actual: JSON.parse(options.body).lines[0].quantity })
        : "<p>Actual output</p>",
      {
        headers: { "Content-Type": url.endsWith("/api/quote") ? "application/json" : "text/html" },
      },
    );
  });
  try {
    const result = await inspectMarketCalculator("http://127.0.0.1:9000", [2, 4], signal());
    assert.equal(result.html, "<p>Actual output</p>");
    assert.deepEqual(
      result.quotes.map((quote) => quote.body.actual),
      [2, 4],
    );
    assert.deepEqual(
      calls.map((call) => call.url),
      [
        "http://127.0.0.1:9000/p/kb-guji-250",
        "http://127.0.0.1:9000/api/quote",
        "http://127.0.0.1:9000/api/quote",
      ],
    );
    assert.ok(calls.every((call) => call.options.redirect === "error"));
  } finally {
    fetch.mock.restore();
  }
});
test("invalid targets, quantity options and closed inspection cause no fetch", async () => {
  const fetch = mock.method(globalThis, "fetch", () => {
    throw new Error("unexpected fetch");
  });
  try {
    for (const origin of [
      "https://other.example",
      "http://user@127.0.0.1:9000",
      "http://127.0.0.1:9000/path",
    ])
      await assert.rejects(inspectMarketCalculator(origin, [1], signal()), /loopback/);
    for (const values of [[], [0], [100], [1, 1], ["1"], [1, 2, 3, 4, 5, 6, 7]])
      await assert.rejects(
        inspectMarketCalculator("http://127.0.0.1:9000", values, signal()),
        /quantities/,
      );
    const abort = new AbortController();
    abort.abort();
    await assert.rejects(
      inspectMarketCalculator("http://127.0.0.1:9000", [1], abort.signal),
      /abort/i,
    );
    assert.equal(fetch.mock.callCount(), 0);
  } finally {
    fetch.mock.restore();
  }
});
test("failed HTTP, malformed JSON and oversized responses are actual inspection failures", async () => {
  for (const [phase, failure] of [
    ["page", new Response("unavailable", { status: 503 })],
    ["page", new Response("x".repeat(524289))],
    ["quote", new Response("not JSON", { headers: { "Content-Type": "application/json" } })],
    ["page", new Response("<p>HTML sent as plain text</p>")],
    ["quote", new Response("x".repeat(16385))],
    ["quote", new Response("unavailable", { status: 503 })],
  ]) {
    const fetch = mock.method(globalThis, "fetch", async (url) =>
      (url.endsWith("/api/quote") ? "quote" : "page") === phase
        ? failure
        : new Response("<p>Actual output</p>", { headers: { "Content-Type": "text/html" } }),
    );
    try {
      await assert.rejects(inspectMarketCalculator("http://127.0.0.1:9000", [1], signal()));
    } finally {
      fetch.mock.restore();
    }
  }
});
