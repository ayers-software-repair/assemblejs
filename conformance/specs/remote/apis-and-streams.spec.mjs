// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 8 and 3.6, on the producer: an api is a route answering JSON, and a streaming api
// answers server-sent events, each message one data line of JSON, which its page names.
import assert from "node:assert/strict";
import { test } from "node:test";
import { originOf } from "../http.mjs";

const producer = originOf("producer");
const at = (path, init) => fetch(new URL(path, producer), init);

test("an api answers JSON at its path, for its method alone", async () => {
  const time = await at("/api/time");
  assert.equal(time.status, 200);
  assert.match(time.headers.get("content-type") ?? "", /^application\/json/);
  assert.deepEqual(await time.json(), { now: "1970-01-01T00:00:00.000Z" });

  const echo = await at("/api/echo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sku: "a1", count: 2 }),
  });
  assert.equal(echo.status, 200);
  assert.deepEqual(await echo.json(), { received: { sku: "a1", count: 2 } });
  assert.ok([404, 405].includes((await at("/api/echo")).status), "GET is not its method");
});

test("a stream answers events, one data line of JSON per message whatever its payload holds", async () => {
  const controller = new AbortController();
  const response = await at("/api/ticks", {
    headers: { accept: "text/event-stream" },
    signal: controller.signal,
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/event-stream/);
  const reader = response.body.getReader();
  let text = "";
  while (!/\n\n/.test(text.replace(/^:.*\n\n/gm, ""))) {
    const { value, done } = await reader.read();
    if (done) break;
    text += new TextDecoder().decode(value);
  }
  controller.abort();
  const data = text.split("\n").filter((line) => line.startsWith("data:"));
  assert.equal(data.length, 1, text);
  assert.deepEqual(JSON.parse(data[0].slice("data:".length)), {
    topic: "tick",
    payload: { n: 1, note: "two\nlines" },
  });
});

test("a stream answers GET and not HEAD", async () => {
  assert.notEqual((await at("/api/ticks", { method: "HEAD" })).status, 200);
});

test("the page names its stream in its head, for its runtime to open", async () => {
  const page = await (await at("/")).text();
  const head = page.slice(0, page.indexOf("</head>"));
  assert.match(head, /<meta name="assemblejs-stream" content="\/api\/ticks">/);
});
