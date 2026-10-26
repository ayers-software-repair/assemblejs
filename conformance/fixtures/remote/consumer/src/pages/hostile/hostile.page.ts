// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@asmjs/core";

const hostile = process.env.HOSTILE_ORIGIN ?? "";
const from = (origin: string, name: string): string => `${origin}/assembly/${name}/`;

export default definePage({
  place: {
    typed: { url: from(hostile, "typed") },
    moved: { url: from(hostile, "moved") },
    cookie: { url: from(hostile, "cookie") },
    seen: { url: from(hostile, "seen") },
    gone: { url: from(hostile, "gone") },
    erred: { url: from(hostile, "erred") },
    stall: { url: from(hostile, "stall"), deadline: 300 },
    hidden: { url: from(hostile, "hidden") },
    heading: { url: from(hostile, "heading") },
    deep: { url: from(hostile, "deep") },
    crowd: { url: from(hostile, "crowd") },
  },
});
