// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: [
    "modes.probe.ts",
    "source-provider.probe.ts",
    "calculator.probe.ts",
    "workspace.probe.ts",
    "workspace-version.probe.ts",
    "draft-recovery.probe.ts",
    "existing-practice.probe.ts",
    "calculator-check.probe.ts",
  ],
  timeout: 60000,
  workers: 1,
  retries: 0,
  outputDir: "../../test-results/academy-modes",
  use: {
    browserName: "chromium",
    headless: true,
    viewport: { width: 1280, height: 900 },
    trace: "retain-on-failure",
  },
});
