// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { Slot } from "@assemblejs/renderer-solid/client";
import { createSignal } from "solid-js";

// A Solid assembly that places a Lit one.
export default function SolidShell() {
  const [count, setCount] = createSignal(0);
  return (
    <section>
      <button type="button" id="solid-shell-bump" onClick={() => setCount(count() + 1)}>
        solid shell {count()}
      </button>
      <Slot name="lit-counter" />
    </section>
  );
}
