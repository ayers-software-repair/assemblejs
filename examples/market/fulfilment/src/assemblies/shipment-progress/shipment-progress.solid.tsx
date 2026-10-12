// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyProps } from "@assemblejs/renderer-solid";
import { For, Show, createSignal, onCleanup, onMount } from "solid-js";

type Progress = {
  known: boolean;
  steps: string[];
  at: number;
  city: string;
  parcels: number;
  next: number;
};

// Where a parcel is, as the fulfilment team's server knew it when the page was made. It is
// placed on the shop's order page from this server. In the browser it counts down to the next
// step and then asks the visitor to look again: it cannot ask this server itself from the
// shop's page, so the page is the thing that is reloaded.
export default function ShipmentProgress(props: AssemblyProps<Progress>) {
  const [left, setLeft] = createSignal(Math.ceil(props.data.next / 1000));
  onMount(() => {
    if (props.data.next === 0) return;
    const timer = setInterval(() => setLeft((seconds) => Math.max(0, seconds - 1)), 1000);
    onCleanup(() => clearInterval(timer));
  });
  return (
    <section class="shipment" aria-labelledby="shipment-title">
      <h2 id="shipment-title">Where your parcel is</h2>
      <Show
        when={props.data.known}
        fallback={<p class="notice">The depot has not been told of this order yet.</p>}
      >
        <p class="shipment-to">
          {props.data.parcels} {props.data.parcels === 1 ? "line" : "lines"}, going to{" "}
          {props.data.city}.
        </p>
        <ol class="shipment-steps">
          <For each={props.data.steps}>
            {(step, index) => (
              <li
                class={index() < props.data.at ? "done" : index() === props.data.at ? "now" : ""}
                aria-current={index() === props.data.at ? "step" : undefined}
              >
                {step}
              </li>
            )}
          </For>
        </ol>
        <Show when={props.data.next > 0}>
          <p class="shipment-next" role="status">
            <Show when={left() > 0} fallback={<a href="">It has moved on. Load the page again</a>}>
              The next step is in about {left()} seconds.
            </Show>
          </p>
        </Show>
      </Show>
    </section>
  );
}
