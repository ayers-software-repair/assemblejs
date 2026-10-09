// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { useEvents } from "@assemblejs/renderer-preact/client";
import { useEffect, useState } from "preact/hooks";
import { Label } from "./label.js";

export default function PreactCounter() {
  const events = useEvents();
  const [count, setCount] = useState(0);
  const [heard, setHeard] = useState("nothing");
  useEffect(() => events.on("counted", (message) => setHeard(message.from.name)), [events]);
  return (
    <section>
      <button
        type="button"
        id="preact-bump"
        onClick={() => {
          setCount(count + 1);
          events.send("counted", { count: count + 1 });
        }}
      >
        <Label count={count} />
      </button>
      <span id="preact-heard">{heard}</span>
    </section>
  );
}
