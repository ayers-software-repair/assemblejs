// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";

const producer = process.env.PRODUCER_ORIGIN ?? "";
const from = (origin: string, name: string): string => `${origin}/assembly/${name}/`;

// A page with a parameter placing another server's assembly: the parameter crosses the wire.
export default definePage({ route: "/goods/:sku", place: { tag: { url: from(producer, "tag") } } });
