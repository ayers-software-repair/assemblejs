// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createSignal } from "solid-js";

export const shadow = true;

export default function SolidBox() {
  const [count, setCount] = createSignal(0);
  return (
    <button type="button" class="bump" id="solid-bump" onClick={() => setCount(count() + 1)}>
      solid {count()}
    </button>
  );
}
