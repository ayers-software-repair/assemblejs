// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";

const hostile = process.env.HOSTILE_ORIGIN ?? "";
const from = (origin: string, name: string): string => `${origin}/assembly/${name}/`;

export default definePage({
  place: {
    typed: { url: from(hostile, "typed") },
    moved: { url: from(hostile, "moved") },
    cookie: { url: from(hostile, "cookie") },
    seen: { url: from(hostile, "seen") },
  },
});
