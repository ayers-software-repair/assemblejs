// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

// The built ESM client, loaded the way a browser will load it. Reading dist rather than src is
// deliberate: this is the artifact that ships, and a bundler step that breaks it should break
// this test.
const clientPath = fileURLToPath(new URL("../packages/core/dist/client/index.js", import.meta.url));

const envelope = (id: string, mount?: string): string => {
  const payload = JSON.stringify({
    id,
    name: id,
    view: "default",
    renderer: "html",
    data: { which: id },
    deferred: false,
  });
  const attribute = mount === undefined ? "" : ` data-mount="${mount}"`;
  return `<assembly-root data-id="${id}" data-name="${id}" data-view="default" data-renderer="html"${attribute}><p>server markup for ${id}</p><script type="application/json" data-assembly="${id}">${payload}</script></assembly-root>`;
};

const page = (body: string): string => `<!doctype html>
<html><head><meta charset="utf-8"><title>runtime</title></head>
<body style="margin:0">${body}
<script type="module">
${readFileSync(clientPath, "utf8").replace(/export\s*\{[^}]*\};?/g, "")}
window.mounted = [];
window.runtime = start({
  renderers: { html: { mount: (element, data, context) => {
    window.mounted.push(context.name);
    element.setAttribute("data-hydrated", "true");
    return { unmount: () => {} };
  } } },
});
</script></body></html>`;

test("a static assembly is never mounted, and keeps the markup the server sent", async ({
  page: browser,
}) => {
  await browser.setContent(page(envelope("static", "none") + envelope("live")));
  await expect.poll(() => browser.evaluate(() => window.mounted)).toEqual(["live"]);
  await expect(browser.locator(`[data-id="static"]`)).toContainText("server markup for static");
  await expect(browser.locator(`[data-id="static"]`)).not.toHaveAttribute("data-hydrated", "true");
});

test("every island is removed from the document once read", async ({ page: browser }) => {
  await browser.setContent(page(envelope("a") + envelope("b")));
  await expect.poll(() => browser.evaluate(() => window.mounted.length)).toBe(2);
  const islands = await browser.evaluate(
    () => document.querySelectorAll("script[data-assembly]").length,
  );
  expect(islands).toBe(0);
});

// The named proof for this rung, and the reason a browser is required: a DOM shim has no
// layout, so nothing there can tell whether an element is actually on screen.
test("a visible assembly mounts only once it is scrolled to", async ({ page: browser }) => {
  await browser.setViewportSize({ width: 600, height: 400 });
  await browser.setContent(
    page(envelope("top") + `<div style="height:3000px"></div>` + envelope("far-below", "visible")),
  );

  await expect.poll(() => browser.evaluate(() => window.mounted)).toEqual(["top"]);
  // Three thousand pixels down the page, it has not mounted and its markup is still the
  // server's.
  await expect(browser.locator(`[data-id="far-below"]`)).toContainText(
    "server markup for far-below",
  );

  await browser.locator(`[data-id="far-below"]`).scrollIntoViewIfNeeded();
  await expect.poll(() => browser.evaluate(() => window.mounted)).toEqual(["top", "far-below"]);
});

test("one assembly whose renderer is missing does not stop the others", async ({
  page: browser,
}) => {
  await browser.setContent(
    page(
      `<assembly-root data-id="orphan" data-name="orphan" data-view="default" data-renderer="svelte"><p>server markup for orphan</p><script type="application/json" data-assembly="orphan">{"id":"orphan","name":"orphan","view":"default","renderer":"svelte","data":{},"deferred":false}</script></assembly-root>` +
        envelope("ok"),
    ),
  );
  await expect.poll(() => browser.evaluate(() => window.mounted)).toEqual(["ok"]);
  await expect(browser.locator(`[data-id="orphan"]`)).toContainText("server markup for orphan");
});

// The mission, reduced to its smallest honest test: two assemblies written against different
// renderers, sharing nothing but the page, exchanging a message with no adapter between them.
test("two assemblies in different frameworks exchange an event", async ({ page: browser }) => {
  const react = `<assembly-root data-id="r" data-name="counter" data-view="default" data-renderer="reactish"><button id="bump">bump</button><script type="application/json" data-assembly="r">{"id":"r","name":"counter","view":"default","renderer":"reactish","data":{},"deferred":false}</script></assembly-root>`;
  const svelte = `<assembly-root data-id="s" data-name="readout" data-view="default" data-renderer="sveltish"><p id="readout">nothing yet</p><script type="application/json" data-assembly="s">{"id":"s","name":"readout","view":"default","renderer":"sveltish","data":{},"deferred":false}</script></assembly-root>`;

  await browser.setContent(`<!doctype html>
<html><head><meta charset="utf-8"><title>two frameworks</title></head><body>${react}${svelte}
<script type="module">
${readFileSync(clientPath, "utf8").replace(/export\s*\{[^}]*\};?/g, "")}
window.mounted = [];
start({ renderers: {
  // Stands in for a framework that sends. It knows nothing about the other one.
  reactish: { mount: (element, _data, context) => {
    window.mounted.push(context.name);
    element.querySelector("#bump").addEventListener("click", () => {
      context.events.send("count", { by: context.name });
    });
    return { unmount: () => {} };
  } },
  // Stands in for a different framework that listens. It knows nothing about the first.
  sveltish: { mount: (element, _data, context) => {
    window.mounted.push(context.name);
    context.events.on("count", (message) => {
      element.querySelector("#readout").textContent = "heard from " + message.from.name;
    });
    return { unmount: () => {} };
  } },
} });
</script></body></html>`);

  await expect.poll(() => browser.evaluate(() => window.mounted)).toEqual(["counter", "readout"]);
  await expect(browser.locator("#readout")).toHaveText("nothing yet");
  await browser.locator("#bump").click();
  await expect(browser.locator("#readout")).toHaveText("heard from counter");
});
