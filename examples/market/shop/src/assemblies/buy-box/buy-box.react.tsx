// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyProps } from "@assemblejs/renderer-react";
import { useEvents } from "@assemblejs/renderer-react/client";
import { useEffect, useState } from "react";
import { basket, price } from "../../browser/basket.js";
import { viewed } from "../../browser/viewed.js";

type Offer = {
  found: boolean;
  sku: string;
  name: string;
  cents: number;
  left: number;
  grind: string;
};

// The part of a product page that sells: the price, what is left, and the button. The product
// beside it is the catalogue team's, from their server; this is the shop's own, so it can keep
// the basket and hear the stock change.
export default function BuyBox({ data }: AssemblyProps<Offer>) {
  const events = useEvents();
  const [left, setLeft] = useState(data.left);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState("");

  // The page's stream says every change of stock on the bus, and this hears its own.
  useEffect(
    () =>
      events.on<{ sku: string; left: number }>("stock:changed", (said) => {
        if (said.payload.sku === data.sku) setLeft(said.payload.left);
      }),
    [events, data.sku],
  );
  useEffect(() => {
    if (data.found) viewed.note(data.sku, data.name);
  }, [data.found, data.sku, data.name]);

  if (!data.found) return <p className="notice">This is not on our shelves.</p>;
  const most = Math.min(left, 99);
  const add = (): void => {
    const lines = basket.add(data.sku, data.name, quantity, data.grind);
    events.send("basket:changed", { count: basket.count(lines) });
    setAdded(`${quantity} added to your basket`);
  };
  return (
    <aside className="buy" aria-label="Buy this">
      <p className="buy-price">{price(data.cents)}</p>
      <p className={left === 0 ? "buy-left buy-none" : "buy-left"} role="status">
        {left === 0 ? "Sold through" : left <= 3 ? `Only ${left} left` : `${left} in stock`}
      </p>
      {data.grind !== "" && <p className="buy-grind">Ground for: {data.grind}</p>}
      <label className="field">
        <span>How many</span>
        <input
          type="number"
          min={1}
          max={Math.max(1, most)}
          value={quantity}
          disabled={left === 0}
          onChange={(event) =>
            setQuantity(Math.max(1, Math.min(most, Number(event.target.value) || 1)))
          }
        />
      </label>
      <button type="button" disabled={left === 0} onClick={add}>
        Add to basket
      </button>
      <p className="buy-added" role="status">
        {added}
        {added !== "" && (
          <>
            . <a href="/basket">See your basket</a>
          </>
        )}
      </p>
    </aside>
  );
}
