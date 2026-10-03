// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { StreamSource } from "@assemblejs/core/client";

/** An event source a test drives by hand, recording the url it was opened with. */
export const fakeStream = () => {
  const opened: string[] = [];
  let closed = 0;
  const source: StreamSource & { emit(data: string): void } = {
    onmessage: null,
    close: () => (closed += 1),
    emit(data) {
      this.onmessage?.(new MessageEvent("message", { data }));
    },
  };
  const open = (url: string) => {
    opened.push(url);
    return source;
  };
  return { open, source, opened, closed: () => closed };
};
