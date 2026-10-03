// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createSignal } from "solid-js";
import type { AssemblyProps } from "@assemblejs/renderer-solid";

/** A counter both test projects build: the server one renders it, the browser one hydrates it. */
export const Counter = (props: AssemblyProps) => {
  const [count, setCount] = createSignal(0);
  return (
    <button type="button" onClick={() => setCount(count() + 1)}>
      {String(props.data["label"])} {count()}
    </button>
  );
};
