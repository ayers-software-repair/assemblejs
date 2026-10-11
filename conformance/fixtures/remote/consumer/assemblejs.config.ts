// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "@assemblejs/core";

// Where each remote is is known only where the server runs, so it is read from the environment.
const producer = process.env.PRODUCER_ORIGIN ?? "";
const hostile = process.env.HOSTILE_ORIGIN ?? "";

// The producer is trusted with the page's query; the hostile remote is declared and is not.
export default defineConfig({
  remotes: [
    { origin: producer, trusted: true },
    { origin: hostile, forward: ["accept-language"] },
  ],
});
