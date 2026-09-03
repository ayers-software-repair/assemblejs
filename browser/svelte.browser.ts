// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { expect, test } from "@playwright/test";
import { bundleFixture } from "./build-fixture.mjs";

// THE DAY-ONE PROOF, and the whole mission in one test.
//
// A Svelte assembly and a React assembly on one page. The Svelte one sends an event; the React
// one displays it. Neither imports the other. Neither knows the other's framework. Nothing sits
// between them but the page's own bus. This is what "hire a React developer and a Svelte
// developer and put them on the same page" means when it is not a slogan.
//
// It runs in a real browser because Svelte 5's client runtime reads Node.prototype getter
// descriptors when it initialises, and no DOM shim reproduces those faithfully.
test("a Svelte assembly and a React assembly share a page and an event", async ({ page }) => {
  const script = await bundleFixture("two-frameworks.tsx");

  // The markup each renderer's server half produced, each in its envelope with its island.
  const svelteAssembly = `<assembly-root data-id="s" data-name="counter" data-view="default" data-renderer="svelte"><button type="button" id="bump">Clicked 0</button><script type="application/json" data-assembly="s">{"id":"s","name":"counter","view":"default","renderer":"svelte","data":{"label":"Clicked"},"deferred":false}</script></assembly-root>`;
  const reactAssembly = `<assembly-root data-id="r" data-name="readout" data-view="default" data-renderer="react"><p id="readout">nothing yet</p><script type="application/json" data-assembly="r">{"id":"r","name":"readout","view":"default","renderer":"react","data":{},"deferred":false}</script></assembly-root>`;

  await page.setContent(`<!doctype html>
<html><head><meta charset="utf-8"><title>two frameworks, one page</title></head>
<body>${svelteAssembly}${reactAssembly}
<script type="module">${script}</script></body></html>`);

  await expect.poll(() => page.evaluate(() => window.mounted)).toEqual(["counter", "readout"]);

  // Before anything is clicked, each shows what its own server half rendered.
  await expect(page.locator("#bump")).toContainText("Clicked");
  await expect(page.locator("#readout")).toHaveText("nothing yet");

  // One click in Svelte. The React assembly hears it, and says who sent it.
  await page.locator("#bump").click();
  await expect(page.locator("#bump")).toContainText("1");
  await expect(page.locator("#readout")).toHaveText("counter counted 1");

  // Again, to prove it is a live channel and not a single delivery.
  await page.locator("#bump").click();
  await expect(page.locator("#readout")).toHaveText("counter counted 2");
});
