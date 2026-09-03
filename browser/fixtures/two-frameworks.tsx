// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// THE DAY-ONE PROOF. A Svelte assembly and a React assembly on one page. The Svelte one sends;
// the React one displays. Neither imports the other, neither knows the other's framework, and
// nothing sits between them but the page's own bus.
import { useEffect, useState } from "react";
import { start } from "@assemblejs/core/client";
import { hydrate as hydrateReact, useEvents } from "@assemblejs/renderer-react/client";
import { hydrate as hydrateSvelte } from "@assemblejs/renderer-svelte/client";
import Counter from "./Counter.svelte";

const Readout = () => {
  const events = useEvents();
  const [heard, setHeard] = useState("nothing yet");
  useEffect(
    () =>
      events.on("counted", (message) =>
        setHeard(
          `${message.from.name} counted ${String((message.payload as { count: number }).count)}`,
        ),
      ),
    [events],
  );
  return <p id="readout">{heard}</p>;
};

declare global {
  interface Window {
    mounted: string[];
  }
}

window.mounted = [];
start({
  renderers: {
    svelte: {
      mount: (element, data, context) => {
        window.mounted.push(context.name);
        return hydrateSvelte(Counter).mount(element, data, context);
      },
    },
    react: {
      mount: (element, data, context) => {
        window.mounted.push(context.name);
        return hydrateReact(Readout).mount(element, data, context);
      },
    },
  },
});
