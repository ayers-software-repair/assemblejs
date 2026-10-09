// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createSignal, onMount } from "solid-js";

/**
 * The part of the late fixture that arrives in its own module. It marks itself once it is live
 * in the browser, so a test can tell the node it adopted from one it rendered afresh.
 */
export default function LatePart() {
  const [live, setLive] = createSignal(false);
  onMount(() => setLive(true));
  return <span data-live={live() ? "" : undefined}>late</span>;
}
