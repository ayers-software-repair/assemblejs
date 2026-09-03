// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { expect, test } from "@playwright/test";
import { bundleFixture } from "./build-fixture.mjs";

// The rung's named proof: a React assembly hydrating BESIDE a plain HTML assembly on one page.
// Beside is the point. Either one alone proves a renderer works; together they prove the thing
// the product is for, which is that a page carries more than one kind of assembly at once.
test("a React assembly hydrates beside a plain HTML assembly", async ({ page }) => {
  const script = await bundleFixture("react-beside-html.tsx");

  // The server's markup, exactly as core would have emitted it: React's own server output for
  // the counter, and static html for the other, each in its envelope with its island.
  const reactAssembly = `<assembly-root data-id="r" data-name="counter" data-view="default" data-renderer="react"><button type="button" id="bump">Clicked <!-- -->0</button><script type="application/json" data-assembly="r">{"id":"r","name":"counter","view":"default","renderer":"react","data":{"label":"Clicked"},"deferred":false}</script></assembly-root>`;
  const htmlAssembly = `<assembly-root data-id="h" data-name="notice" data-view="default" data-renderer="html"><p id="notice">Written in plain HTML</p><script type="application/json" data-assembly="h">{"id":"h","name":"notice","view":"default","renderer":"html","data":{},"deferred":false}</script></assembly-root>`;

  await page.setContent(`<!doctype html>
<html><head><meta charset="utf-8"><title>react beside html</title></head>
<body>${reactAssembly}${htmlAssembly}
<script type="module">${script}</script></body></html>`);

  // The React one hydrates. The HTML one has no renderer registered and is left exactly as the
  // server sent it, which is the correct outcome and not a failure.
  await expect.poll(() => page.evaluate(() => window.mounted)).toEqual(["counter"]);
  await expect(page.locator("#notice")).toHaveText("Written in plain HTML");

  // Server markup was there before any of it ran, and is now interactive.
  await expect(page.locator("#bump")).toContainText("Clicked");
  await page.locator("#bump").click();
  await expect(page.locator("#bump")).toContainText("1");

  // Both islands are gone: the runtime read them and removed them, whether or not it mounted.
  expect(await page.evaluate(() => document.querySelectorAll("script[data-assembly]").length)).toBe(
    0,
  );
});
