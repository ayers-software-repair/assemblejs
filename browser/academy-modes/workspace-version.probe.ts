// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { serveModes } from "./serve-modes.mjs";

test("workspace refuses observed outside edits before building, then recovers on current source", async ({
  page,
}, info) => {
  test.setTimeout(150000);
  const fixture = await serveModes("workspace");
  const runtime = fixture.runtime;
  if (!runtime) {
    await fixture.close();
    throw new Error("workspace proof requires the actual preview runtime");
  }
  const errors: string[] = [];
  const responses: number[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) responses.push(response.status());
  });
  try {
    await page.goto(`${fixture.origin}/?workspace`);
    const build = page.getByRole("button", { name: "Check & preview", exact: true });
    const status = page.getByRole("status", { name: "Workspace status", exact: true });
    const diagnostics = page.locator(".academy-application-preview details pre");
    let changed = false;
    await page.route("**/call-tool", async (route) => {
      if (!changed && route.request().postDataJSON().name === "check") {
        const reply = await route.fetch();
        fixture.outside("source-guard", "<p>Outside edit is kept.</p>");
        changed = true;
        await route.fulfill({ response: reply });
      } else await route.continue();
    });
    await build.click();
    await expect(status).toContainText("Preview could not start");
    await expect(diagnostics).toContainText("Project source changed");
    expect(changed).toBe(true);
    expect(runtime.builds()).toEqual([]);
    await expect(page.locator("iframe")).toHaveCount(0);
    expect(fixture.source("source-guard")).toBe("<p>Outside edit is kept.</p>");
    await page.getByText("Build diagnostics", { exact: true }).click();
    await page.screenshot({
      path: info.outputPath("workspace-source-change-refused.png"),
      fullPage: true,
    });
    await page.unroute("**/call-tool");
    await build.click();
    await expect(status).toContainText("Build completed", { timeout: 60000 });
    const preview = page.frameLocator('iframe[title="Application preview"]');
    await expect(preview.locator("assembly-root")).toHaveCount(12);
    await expect(preview.locator("assembly-root[data-failed]")).toHaveCount(0);
    const current = await fetch(`${fixture.origin}/call-tool`, {
      method: "POST",
      headers: { Origin: fixture.origin, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "read_source_version", arguments: {} }),
    });
    expect(current.status).toBe(200);
    const answer = JSON.parse((await current.json()).content[0].text) as {
      ok: boolean;
      result: { version: string };
      problems: unknown[];
    };
    expect(answer.ok).toBe(true);
    expect(answer.problems).toEqual([]);
    expect(answer.result.version).toMatch(/^[a-f0-9]{12}$/);
    expect(JSON.parse((await diagnostics.textContent()) ?? "{}").version).toBe(
      answer.result.version,
    );
    expect(runtime.builds()).toHaveLength(4);
    expect(runtime.builds().every((record: { ok: boolean }) => record.ok)).toBe(true);
    await page.getByRole("button", { name: "Stop preview", exact: true }).click();
    await expect(status).toHaveText("Preview stopped. Your source is kept.");
    expect(runtime.active()).toEqual([]);
    expect(fixture.source("source-guard")).toBe("<p>Outside edit is kept.</p>");
    expect(errors).toEqual([]);
    expect(responses).toEqual([]);
  } finally {
    try {
      try {
        await page.close();
      } finally {
        await fixture.close();
      }
    } finally {
      await writeFile(
        info.outputPath("workspace-source-version.json"),
        JSON.stringify(
          {
            errors,
            responses,
            calls: fixture.calls,
            builds: runtime.builds(),
            active: runtime.active(),
          },
          null,
          2,
        ),
      );
      expect(runtime.active()).toEqual([]);
    }
  }
});

test("authored check guidance explains a real MCP finding and recovery without writes or builds", async ({
  page,
}, info) => {
  const fixture = await serveModes("workspace");
  const runtime = fixture.runtime;
  if (!runtime) {
    await fixture.close();
    throw new Error("workspace proof requires the actual preview runtime");
  }
  const errors: string[] = [];
  const responses: number[] = [];
  let evidence: object = {};
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) responses.push(response.status());
  });
  try {
    await page.goto(`${fixture.origin}/?workspace`);
    const product = fixture.calculatorSource("product.html");
    if (product === null) throw new Error("supplied product page is missing");
    await expect(page.getByRole("textbox", { name: "Source code", exact: true })).toHaveValue(
      product,
    );
    const practice = page.getByRole("region", { name: "Mode practice", exact: true });
    await practice.getByText("Guided tutor", { exact: true }).click();
    const question = practice.getByRole("textbox", { name: "Ask guided tutor", exact: true });
    const answer = practice.getByRole("status", { name: "Tutor answer", exact: true });
    fixture.outside("source-guard", "<img>");
    const before = fixture.calls.length;
    await question.fill("Check and explain");
    await question.press("Enter");
    await expect(answer).toContainText("an-image-has-an-alternative");
    await expect(answer).toContainText("Why: WCAG 2.2");
    await expect(question).toBeFocused();
    const failed = await answer.textContent();
    const reads = fixture.calls.slice(before);
    expect(reads.map((call: { name: string }) => call.name)).toEqual([
      "read_source_version",
      "check",
      "explain",
      "read_source_version",
    ]);
    expect(reads[2].arguments).toEqual({ id: "an-image-has-an-alternative" });
    expect(fixture.source("source-guard")).toBe("<img>");
    expect(fixture.calculatorSource("product.html")).toBe(product);
    expect(runtime.builds()).toEqual([]);
    expect(runtime.active()).toEqual([]);
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(practice.getByRole("heading")).toHaveText("1. Plan without writing");
    await page.screenshot({
      path: info.outputPath("tutor-real-check-explained.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await question.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath("tutor-real-check-narrow.png"), fullPage: true });
    const unchangedCalls = fixture.calls.length;
    await question.fill("Why");
    await question.press("Enter");
    await expect(answer).toContainText("A plan is a proposal");
    expect(fixture.calls).toHaveLength(unchangedCalls);
    fixture.outside("source-guard", '<img alt="">');
    await question.fill("Explain check");
    await question.press("Enter");
    await expect(answer).toContainText("Project check passed at observed revision");
    await expect(answer).toContainText("Preview and lesson completion are not verified");
    const recovered = await answer.textContent();
    expect(recovered?.match(/[a-f0-9]{12}/)?.[0]).not.toBe(failed?.match(/[a-f0-9]{12}/)?.[0]);
    expect(fixture.calls.slice(unchangedCalls).map((call: { name: string }) => call.name)).toEqual([
      "read_source_version",
      "check",
      "read_source_version",
    ]);
    expect(fixture.source("source-guard")).toBe('<img alt="">');
    expect(fixture.calculatorSource("product.html")).toBe(product);
    expect(runtime.builds()).toEqual([]);
    await expect(practice.getByRole("heading")).toHaveText("1. Plan without writing");
    await page.screenshot({
      path: info.outputPath("tutor-real-check-recovered.png"),
      fullPage: true,
    });
    evidence = {
      failed,
      recovered,
      calls: fixture.calls,
      builds: runtime.builds(),
      active: runtime.active(),
    };
    expect(errors).toEqual([]);
    expect(responses).toEqual([]);
  } finally {
    try {
      await page.close();
    } finally {
      try {
        await fixture.close();
      } finally {
        await writeFile(
          info.outputPath("tutor-real-check-evidence.json"),
          JSON.stringify({ ...evidence, errors, responses }, null, 2),
        );
      }
    }
    expect(runtime.active()).toEqual([]);
  }
});
