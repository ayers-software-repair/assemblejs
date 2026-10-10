// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { Slot } from "@assemblejs/renderer-preact/client";
import { useState } from "preact/hooks";

// A Preact assembly that places a Vue one.
export default function PreactShell() {
  const [count, setCount] = useState(0);
  return (
    <section>
      <button type="button" id="preact-shell-bump" onClick={() => setCount(count + 1)}>
        preact shell {count}
      </button>
      <Slot name="vue-counter" />
    </section>
  );
}
