// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "@assemblejs/core";

// Where each remote is is known only where the server runs, so it is read from the environment.
const producer = process.env.PRODUCER_ORIGIN ?? "";
const hostile = process.env.HOSTILE_ORIGIN ?? "";

export default defineConfig({
  remotes: [{ origin: producer }, { origin: hostile, forward: ["accept-language"] }],
});
