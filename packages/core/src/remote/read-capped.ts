// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * A response body as text, or undefined once it passes the cap. Read as it streams and abandoned
 * at the cap, so a remote that answers with a gigabyte costs a few megabytes, never the gigabyte.
 */
export async function readCapped(
  response: Response,
  maxBytes: number,
): Promise<string | undefined> {
  const declared = Number(response.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) {
    await response.body?.cancel();
    return undefined;
  }
  if (response.body === null) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return undefined;
    }
    chunks.push(value);
  }
  const joined = new Uint8Array(total);
  let at = 0;
  for (const chunk of chunks) {
    joined.set(chunk, at);
    at += chunk.byteLength;
  }
  return new TextDecoder().decode(joined);
}
