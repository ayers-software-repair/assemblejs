// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Test-only transport: finish consuming each response before reporting a saved file. */
export function createFileProvider() {
  return {
    async readFile(path) {
      const response = await fetch("/files/" + encodeURIComponent(path));
      const text = await response.text();
      if (!response.ok) throw new Error(text);
      return text;
    },
    async writeFile(path, after, before) {
      const response = await fetch("/files/" + encodeURIComponent(path), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ before, after }),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(text);
      if (text !== "saved") throw new Error("save acknowledgement missing");
    },
  };
}
