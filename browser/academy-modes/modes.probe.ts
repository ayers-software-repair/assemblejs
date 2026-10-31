// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { serveModes } from "./serve-modes.mjs";

test("Plan, reject/revise/approve and Auto call the actual shared project tools", async ({
  page,
}, info) => {
  const fixture = await serveModes();
  const errors: string[] = [];
  const failures: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("requestfailed", (request) =>
    failures.push(`${request.url()}: ${request.failure()?.errorText}`),
  );
  try {
    await page.goto(fixture.origin);
    const name = page.getByRole("textbox", { name: "Assembly name" });
    const mode = page.getByRole("combobox", { name: "Agent mode" });
    const status = page.getByRole("status");
    await name.fill("quantity-note");
    await page.getByRole("button", { name: "Plan assembly", exact: true }).click();
    await expect(status).toContainText("Plan ready. No files written");
    expect(fixture.source("quantity-note")).toBeNull();
    const reviewed = await page.locator("ins").textContent();
    expect(reviewed).toBeTruthy();
    await expect(page.getByRole("button", { name: "Approve changes" })).toBeDisabled();
    await mode.selectOption("auto");
    expect(fixture.source("quantity-note")).toBeNull();
    expect(fixture.calls.map((call: { name: string }) => call.name)).toEqual(["plan_assembly"]);
    await mode.selectOption("approval");
    await page.getByRole("button", { name: "Reject proposal" }).click();
    await expect(status).toHaveText("Proposal rejected. No files were written.");
    expect(fixture.source("quantity-note")).toBeNull();
    await name.fill("revised-note");
    await page.getByRole("button", { name: "Propose changes" }).click();
    await expect(status).toContainText("Plan ready");
    const revised = await page.locator("ins").textContent();
    await page.getByRole("button", { name: "Approve changes" }).click();
    await expect(status).toContainText("Files applied; project check passed");
    expect(fixture.source("revised-note")).toBe(revised);
    await mode.selectOption("auto");
    await name.fill("auto-note");
    await page.getByRole("button", { name: "Add assembly and check" }).click();
    await expect(status).toContainText("Files applied; project check passed");
    expect(fixture.source("auto-note")).toBeTruthy();
    await page.screenshot({ path: info.outputPath("modes-desktop.png"), fullPage: true });
    await mode.selectOption("approval");
    await name.fill("concurrent-note");
    await page.getByRole("button", { name: "Propose changes" }).click();
    await expect(status).toContainText("Plan ready");
    fixture.outside("concurrent-note", "<p>Manual work survives</p>\n");
    await page.getByRole("button", { name: "Approve changes" }).click();
    await expect(status).toContainText("Apply refused or incomplete");
    expect(fixture.source("concurrent-note")).toBe("<p>Manual work survives</p>\n");
    await expect(page.getByRole("button", { name: "Approve changes" })).toBeDisabled();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath("modes-narrow.png"), fullPage: true });
    expect(fixture.calls.map((call: { name: string }) => call.name)).toEqual([
      "plan_assembly",
      "discard_assembly_plan",
      "plan_assembly",
      "apply_assembly_plan",
      "check",
      "plan_assembly",
      "apply_assembly_plan",
      "check",
      "plan_assembly",
      "apply_assembly_plan",
    ]);
    expect(errors).toEqual([]);
    expect(failures).toEqual([]);
  } finally {
    try {
      await writeFile(
        info.outputPath("actual-tool-calls.json"),
        JSON.stringify(fixture.calls, null, 2),
      );
    } finally {
      try {
        await page.close();
      } finally {
        await fixture.close();
      }
    }
  }
});
