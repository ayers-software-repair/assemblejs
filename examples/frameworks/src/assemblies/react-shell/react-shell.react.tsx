// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { Slot } from "@assemblejs/renderer-react/client";
import { useState } from "react";

// A React assembly that places a Svelte one. The slot writes the directive, the server puts the
// counter where it stood, and React leaves it alone when this assembly renders again.
export default function ReactShell() {
  const [count, setCount] = useState(0);
  return (
    <section>
      <button type="button" id="react-shell-bump" onClick={() => setCount(count + 1)}>
        react shell {count}
      </button>
      <Slot name="svelte-counter" />
    </section>
  );
}
