// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyProps } from "@asmjs/renderer-solid";
import { Slot } from "@asmjs/renderer-solid/client";
import { Counter } from "./counter.js";

/** An assembly that places a child assembly ahead of a counter of its own. */
export const Outer = (_props: AssemblyProps) => (
  <article>
    <Slot name="inner" />
    <Counter data={{ label: "Outer" }} />
  </article>
);
