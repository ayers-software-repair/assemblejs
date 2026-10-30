// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "*.probe.ts",
  timeout: 300000,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  outputDir: "../../test-results/academy-runtime",
  use: { headless: true, trace: "retain-on-failure" },
});
