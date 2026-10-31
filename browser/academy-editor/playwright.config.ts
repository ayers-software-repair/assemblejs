// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "editor.probe.ts",
  timeout: 60000,
  workers: 1,
  retries: 0,
  outputDir: "../../test-results/academy-editor",
  use: {
    browserName: "chromium",
    headless: true,
    viewport: { width: 1280, height: 900 },
    trace: "retain-on-failure",
  },
});
