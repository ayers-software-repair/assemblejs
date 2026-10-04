// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";

const producer = process.env.PRODUCER_ORIGIN ?? "";
const from = (origin: string, name: string): string => `${origin}/assembly/${name}/`;

export default definePage({
  place: { tally: { url: from(producer, "tally"), cache: { ttl: 60_000 } } },
});
