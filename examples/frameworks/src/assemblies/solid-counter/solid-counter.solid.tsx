// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { useEvents } from "@assemblejs/renderer-solid/client";
import { createSignal, onCleanup, onMount } from "solid-js";

export default function SolidCounter() {
  const events = useEvents();
  const [count, setCount] = createSignal(0);
  const [heard, setHeard] = createSignal("nothing");
  onMount(() => {
    const stop = events.on("counted", (message) => setHeard(message.from.name));
    onCleanup(stop);
  });
  return (
    <section>
      <button
        type="button"
        id="solid-bump"
        onClick={() => {
          setCount(count() + 1);
          events.send("counted", { count: count() });
        }}
      >
        solid {count()}
      </button>
      <span id="solid-heard">{heard()}</span>
    </section>
  );
}
