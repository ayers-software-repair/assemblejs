// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "@playwright/test";

// The browser proof, kept out of `pnpm test` because it needs a browser engine and the unit
// suite must stay runnable anywhere. What lives here is what a DOM shim cannot honestly answer:
// real layout, a real IntersectionObserver, and real module loading.
export default defineConfig({
  testDir: ".",
  testMatch: "**/*.browser.ts",
  fullyParallel: true,
  reporter: [["list"]],
  use: { headless: true },
});
