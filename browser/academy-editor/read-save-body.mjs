// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Keep UTF-8 characters intact across HTTP chunks and bound the test fixture's input. */
export async function readSaveBody(request) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > 256000) throw new Error("save body is too large");
    chunks.push(chunk);
  }
  const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (typeof value?.before !== "string" || typeof value?.after !== "string")
    throw new Error("source text required");
  return { before: value.before, after: value.after };
}
