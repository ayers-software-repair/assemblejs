// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readCappedBytes } from "./read-capped-bytes.js";

/** A response body as text, or undefined once it passes the cap (see `readCappedBytes`). */
export async function readCapped(
  response: Response,
  maxBytes: number,
): Promise<string | undefined> {
  const bytes = await readCappedBytes(response, maxBytes);
  return bytes === undefined ? undefined : new TextDecoder().decode(bytes);
}
