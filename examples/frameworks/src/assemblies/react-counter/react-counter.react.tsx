// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { useEvents } from "@assemblejs/renderer-react/client";
import { useEffect, useState } from "react";

export default function ReactCounter() {
  const events = useEvents();
  const [count, setCount] = useState(0);
  const [heard, setHeard] = useState("nothing");
  useEffect(() => events.on("counted", (message) => setHeard(message.from.name)), [events]);
  return (
    <section>
      <button
        type="button"
        id="react-bump"
        onClick={() => {
          setCount(count + 1);
          events.send("counted", { count: count + 1 });
        }}
      >
        react {count}
      </button>
      <span id="react-heard">{heard}</span>
    </section>
  );
}
