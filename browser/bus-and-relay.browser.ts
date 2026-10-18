// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { freePort, saidBy } from "./child-server.js";
import { clickMounted } from "./mounted.js";

// R-14 AND R-15 IN A REAL BROWSER. Three servers from one build of examples/realtime, each told
// the same two addresses: the site, whose /bus page has an assembly of its own (the sender), and
// two other servers whose assemblies it places by url. The site declares one of them
// `events: true` and `forward: ["accept-language"]`, the other neither. The site's own page
// runtime and each remote's runtime are separate bundles in one document; whether they share a
// bus, and whether a remote's browser half can reach its own api, is a thing only a browser
// answers.
const example = fileURLToPath(new URL("../examples/realtime/", import.meta.url));

const running: ChildProcess[] = [];
let admitted = "";
let other = "";
let site = "";

/** Starts the built example on a port chosen beforehand and checks it listens at that origin. */
const serve = async (port: string, environment: Record<string, string>): Promise<void> => {
  const child = spawn(process.execPath, ["dist/server.js"], {
    cwd: example,
    env: { ...process.env, ...environment, ASSEMBLEJS_PORT: port },
    stdio: ["ignore", "pipe", "pipe"],
  });
  running.push(child);
  const listening = await new Promise<string>((resolve, reject) => {
    child.stdout?.on("data", (chunk: Buffer) => {
      const found = /listening (http:\/\/\S+)/.exec(String(chunk));
      if (found?.[1] !== undefined) resolve(found[1]);
    });
    child.on("exit", (code) =>
      reject(new Error(`the example exited with ${String(code)}${saidBy(child)}`)),
    );
  });
  expect(listening).toBe(`http://127.0.0.1:${port}`);
};

test.beforeAll(async () => {
  const [a, b, c] = [await freePort(), await freePort(), await freePort()];
  admitted = `http://127.0.0.1:${a}`;
  other = `http://127.0.0.1:${b}`;
  site = `http://127.0.0.1:${c}`;
  const environment = { ADMITTED_ORIGIN: admitted, OTHER_ORIGIN: other };
  await Promise.all([serve(a, environment), serve(b, environment), serve(c, environment)]);
});

test.afterAll(() => {
  for (const child of running) child.kill();
});

/** What a remote's envelope holds, found by the server the assembly came from. */
const from = (page: Page, origin: string, inner: string) =>
  page.locator(`assembly-root[data-remote="${origin}"] ${inner}`);
const relay = (origin: string): string =>
  `${site}/_assemblejs/remote/${encodeURIComponent(origin)}/api/answer`;

test("a send from the page's own assembly is heard by the admitted remote and not by the other", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${site}/bus`);

  // Without R-14 the page names no origin in its head and no remote joins the bus. The other
  // server is declared too, and is still not named.
  await expect(page.locator('head meta[name="assemblejs-events"]')).toHaveAttribute(
    "content",
    admitted,
  );

  // Both hearers have mounted and are subscribed before anything is sent, so what the other one
  // does not hear is not a hearer that was late.
  await expect(from(page, admitted, "p[data-ready]")).toHaveCount(1);
  await expect(from(page, other, "p[data-ready]")).toHaveCount(1);
  await clickMounted(page.getByRole("button", { name: "Send ping" }));

  // Without R-14 this stays unset: the sender is on the page's bus and this hearer is on a bus
  // of its own. It was sent by the page's `sender`, a different runtime from the hearer's.
  await expect(from(page, admitted, "p[data-ready]")).toHaveAttribute("data-heard", "page");
  await expect(from(page, admitted, "p[data-ready]")).toHaveAttribute("data-by", "sender");

  // The other hearer was ready before the send and heard the same page's send never arrive. The
  // wait is for a delivery that would be late, so the absence is not just early.
  await page.waitForTimeout(500);
  await expect(from(page, other, "p[data-ready]")).not.toHaveAttribute("data-heard");
  await expect(from(page, other, "p[data-ready]")).not.toHaveAttribute("data-by");
  expect(errors).toEqual([]);
});

test("a remote assembly's browser half reaches its own api through the page's server", async ({
  page,
}) => {
  // Sent with every request the page initiates, the browser half's fetch among them
  // (https://playwright.dev/docs/api/class-page#page-set-extra-http-headers).
  await page.setExtraHTTPHeaders({ "accept-language": "fr" });
  const asked = page.waitForRequest(relay(admitted));
  await page.goto(`${site}/bus`);

  // Without R-15 `api("/api/answer")` is the bare path, which the page's own server answers
  // with its own host (it holds the same api): the host below is the remote's, or this fails.
  const answered = from(page, admitted, "p[data-answer]");
  await expect(answered).toHaveAttribute("data-answer", "relayed");
  await expect(answered).toHaveAttribute("data-host", new URL(admitted).host);
  // The browser sent it, the page's server received it and the relay passed it on because the
  // remote is declared `forward: ["accept-language"]`; a relay that dropped it would leave the
  // remote with the language its own fetch defaults to.
  expect((await (await asked).allHeaders())["accept-language"]).toBe("fr");
  await expect(answered).toHaveAttribute("data-lang", "fr");

  // The relay admits any declared origin, and passes on a header only where it is declared.
  const headers = { "accept-language": "fr" };
  const forwarded = await page.request.get(relay(admitted), { headers });
  expect(forwarded.status()).toBe(200);
  expect(await forwarded.json()).toMatchObject({ word: "relayed", lang: "fr" });
  const declared = await page.request.get(relay(other), { headers });
  expect(declared.status()).toBe(200);
  const answer = (await declared.json()) as { word: string; lang: string | null };
  expect(answer.word).toBe("relayed");
  expect(answer.lang).not.toBe("fr");
  // An origin the project did not declare is the 404 every unknown path is.
  const unknown = await page.request.get(relay("https://not.example"), { headers });
  expect(unknown.status()).toBe(404);
});
