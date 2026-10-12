// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyProps } from "@assemblejs/renderer-react";
import { useEvents } from "@assemblejs/renderer-react/client";
import { useEffect, useMemo, useState } from "react";

type Card = {
  sku: string;
  name: string;
  blurb: string;
  price: string;
  cents: number;
  band: string;
  roast: string;
  mark: string;
  tone: string;
};
type Shelf = { title: string; blurb: string; words: string; products: Card[] };
type Narrowed = { roasts: string[]; bands: string[] };

const ORDERS: { [order: string]: (one: Card, other: Card) => number } = {
  featured: () => 0,
  cheapest: (one, other) => one.cents - other.cents,
  dearest: (one, other) => other.cents - one.cents,
  name: (one, other) => one.name.localeCompare(other.name),
};

// The shelf: every product of a category, narrowed by what the facets beside it say and put
// in the order a visitor picks. The facets are another assembly, written in Vue; the two talk
// over the bus and share no code.
export default function ProductGrid({ data }: AssemblyProps<Shelf>) {
  const events = useEvents();
  const [narrowed, setNarrowed] = useState<Narrowed>({ roasts: [], bands: [] });
  const [order, setOrder] = useState("featured");
  useEffect(
    () => events.on<Narrowed>("facets:changed", (said) => setNarrowed(said.payload)),
    [events],
  );

  const shown = useMemo(
    () =>
      data.products
        .filter(
          (card) =>
            (narrowed.roasts.length === 0 || narrowed.roasts.includes(card.roast)) &&
            (narrowed.bands.length === 0 || narrowed.bands.includes(card.band)),
        )
        .sort(ORDERS[order]),
    [data.products, narrowed, order],
  );
  // The facets say how many each choice would leave, so they are told what is on the shelf.
  useEffect(() => {
    events.send("shelf:shown", { count: shown.length, of: data.products.length });
  }, [events, shown.length, data.products.length]);

  return (
    <section className="shelf" aria-labelledby="shelf-title">
      <header className="shelf-head">
        <div>
          <h1 id="shelf-title">{data.title}</h1>
          <p className="shelf-blurb">
            {data.words === "" ? data.blurb : `Results for "${data.words}"`}
          </p>
        </div>
        <label className="field shelf-order">
          <span>Sort by</span>
          <select value={order} onChange={(event) => setOrder(event.target.value)}>
            <option value="featured">Featured</option>
            <option value="cheapest">Price, low to high</option>
            <option value="dearest">Price, high to low</option>
            <option value="name">Name</option>
          </select>
        </label>
      </header>
      <p className="shelf-count" role="status">
        {shown.length} of {data.products.length} shown
      </p>
      {shown.length === 0 ? (
        <p className="notice">Nothing on this shelf matches. Clear a filter to see more.</p>
      ) : (
        <ul className="shelf-list">
          {shown.map((card) => (
            <li key={card.sku} className="card">
              <a className="card-link" href={`/p/${card.sku}`}>
                <span className={`tile tile-${card.tone}`} aria-hidden="true">
                  {card.mark}
                </span>
                <span className="card-name">{card.name}</span>
              </a>
              <p className="card-blurb">{card.blurb}</p>
              <p className="card-price">{card.price}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
