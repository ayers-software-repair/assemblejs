// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@asmjs/core";

const producer = process.env.PRODUCER_ORIGIN ?? "";
const from = (origin: string, name: string): string => `${origin}/assembly/${name}/`;

// One kept placement, written twice: both are answered with what the cache holds.
export default definePage({
  place: { tally: { url: from(producer, "tally"), cache: { ttl: 60_000 } } },
});
