// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { gzipSync } from "node:zlib";
import type { AssetWeight } from "./asset-weight.js";

/** The weight of a body, as sent and gzipped. */
export function weigh(body: Uint8Array): AssetWeight {
  return { bytes: body.byteLength, gzip: body.byteLength === 0 ? 0 : gzipSync(body).byteLength };
}
