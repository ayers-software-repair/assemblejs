// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { useEvents } from "@assemblejs/renderer-react/client";
import { useEffect, useState } from "react";

export const mount = "visible";

export default function Readout() {
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
}
