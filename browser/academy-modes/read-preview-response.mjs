// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Consume a bounded actual preview response and cancel its stream on refusal. */
export async function readPreviewResponse(response, limit) {
  if (!response.body) throw new Error("Preview returned no response body.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) return text + decoder.decode();
      bytes += part.value.byteLength;
      if (bytes > limit) throw new Error(`Preview response exceeds ${limit} bytes.`);
      text += decoder.decode(part.value, { stream: true });
    }
  } finally {
    try {
      await reader.cancel();
    } finally {
      reader.releaseLock();
    }
  }
}
