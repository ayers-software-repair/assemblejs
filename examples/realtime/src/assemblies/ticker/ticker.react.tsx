// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { useEvents } from "@assemblejs/renderer-react/client";
import { useEffect, useState } from "react";

export default function Ticker() {
  const events = useEvents();
  const [price, setPrice] = useState("waiting");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
    return events.on("price", (message) => setPrice(JSON.stringify(message.payload)));
  }, [events]);
  return (
    <p id="react-price" data-ready={ready ? "" : undefined}>
      {price}
    </p>
  );
}
