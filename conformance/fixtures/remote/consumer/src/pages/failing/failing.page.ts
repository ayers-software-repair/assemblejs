// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";

const producer = process.env.PRODUCER_ORIGIN ?? "";
const from = (origin: string, name: string): string => `${origin}/assembly/${name}/`;

export default definePage({
  place: {
    broken: { url: from(producer, "broken") },
    missing: { url: from(producer, "missing") },
    huge: { url: from(producer, "huge") },
    card: { url: from(producer, "card") },
  },
});
